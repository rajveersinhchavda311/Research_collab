"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../AuthContext"
import api from "../api"

const Projects = () => {
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [me, setMe] = useState(null)
  // Fetch and store incoming access requests per project id (only for owned projects)
  const [incomingByProject, setIncomingByProject] = useState({})

  // username search
  const [userSearch, setUserSearch] = useState("")
  const [userProjects, setUserProjects] = useState([])

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    tags: "",
  })

  // Add notes state
  const [notes, setNotes] = useState({})
  const [editingNote, setEditingNote] = useState(null)
  const [editText, setEditText] = useState("")

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (Object.keys(notes).length > 0) {
      localStorage.setItem('projectNotes', JSON.stringify(notes))
    }
  }, [notes])

  const fetchMe = async () => {
    try {
      const { data } = await api.get("auth/me/")
      setMe(data)
    } catch (e) {
      // ignore
    }
  }

  // Load incoming access requests for owned projects
  const loadIncoming = async () => {
    if (!me) return
    try {
      const owned = projects.filter(p => p.owner?.id === me.id)
      const next = {}
      await Promise.all(
        owned.map(async (p) => {
          try {
            const { data } = await api.get(`projects/${p.id}/incoming_requests/`)
            next[p.id] = data
          } catch (_) {
            next[p.id] = []
          }
        })
      )
      setIncomingByProject(next)
    } catch (e) {
      // ignore
    }
  }

  // Store selected roles for each incoming request
  const [selectedRoles, setSelectedRoles] = useState({});
  const approveRequest = async (projectId, requestId) => {
    const role = selectedRoles[requestId] || "manager";
    try {
      await api.post(`projects/${projectId}/approve_request/`, { request_id: requestId, role })
      await loadIncoming()
      await fetchProjects()
      setSelectedRoles(prev => { const next = { ...prev }; delete next[requestId]; return next; });
    } catch (e) {
      alert(e?.response?.data?.detail || "Approve failed")
    }
  }

  // Fetch real projects from Django backend
  const fetchProjects = async () => {
    try {
      const { data } = await api.get("projects/")
      setProjects(data)
      // Load saved notes from localStorage after projects are loaded
      const savedNotes = localStorage.getItem('projectNotes')
      if (savedNotes) {
        try {
          const parsedNotes = JSON.parse(savedNotes)
          const mergedNotes = { ...parsedNotes }
          data.forEach(project => {
            if (!mergedNotes[project.id]) {
              mergedNotes[project.id] = []
            }
          })
          setNotes(mergedNotes)
        } catch (_) {
          const initialNotes = {}
          data.forEach(project => { initialNotes[project.id] = [] })
          setNotes(initialNotes)
        }
      } else {
        const initialNotes = {}
        data.forEach(project => { initialNotes[project.id] = [] })
        setNotes(initialNotes)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  useEffect(() => { fetchMe(); fetchProjects() }, [])
  useEffect(() => { loadIncoming() }, [me, projects])

  // Create real project in Django backend
  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProject.title.trim() || !newProject.description.trim()) {
      alert("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      await api.post("projects/", { title: newProject.title, description: newProject.description })
      setNewProject({ title: "", description: "", tags: "" })
      setShowCreateForm(false)
      await fetchProjects()
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Error creating project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (projectId) => {
    try {
      await api.post(`projects/${projectId}/complete/`)
      await fetchProjects()
    } catch (e) {
      console.error("Error completing project", e)
    }
  }

  const handleDelete = async (projectId) => {
    if (!confirm("Delete this project? This cannot be undone.")) return
    try {
      await api.delete(`projects/${projectId}/`)
      await fetchProjects()
    } catch (e) {
      alert(e?.response?.data?.detail || "Delete failed")
    }
  }

  const searchByUsername = async () => {
    if (!userSearch.trim()) return
    try {
      const { data } = await api.get(`projects/by_username/`, { params: { username: userSearch.trim() } })
      setUserProjects(data)
    } catch (e) {
      setUserProjects([])
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewProject((prev) => ({ ...prev, [name]: value }))
  }

  // Notes helpers
  const addNote = (projectId, noteText) => {
    if (!noteText.trim()) return
    const note = { id: Date.now(), text: noteText, timestamp: new Date().toLocaleString() }
    setNotes(prev => ({ ...prev, [projectId]: [...(prev[projectId] || []), note] }))
  }
  const startEditNote = (note) => { setEditingNote(note.id); setEditText(note.text) }
  const saveEditNote = (projectId, noteId) => {
    if (!editText.trim()) return
    setNotes(prev => ({ ...prev, [projectId]: prev[projectId].map(n => n.id === noteId ? { ...n, text: editText } : n) }))
    setEditingNote(null); setEditText("")
  }
  const cancelEdit = () => { setEditingNote(null); setEditText("") }
  const removeNote = (projectId, noteId) => { setNotes(prev => ({ ...prev, [projectId]: prev[projectId].filter(n => n.id !== noteId) })) }

  // Calculate stats
  const numActive = projects.filter(p => p.status !== 'completed').length
  const numCompleted = projects.filter(p => p.status === 'completed').length
  const stats = [
    { label: "Active Projects", value: String(numActive), icon: "📊", type: "projects" },
    { label: "Total Projects", value: String(projects.length), icon: "👥", type: "collaborators" },
    { label: "Completed", value: String(numCompleted), icon: "📄", type: "publications" },
  ]

  // Filter projects based on search and tab only
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const isActive = project.status !== 'completed'
    const matchesTab = activeTab === "all" || (activeTab === "active" && isActive) || (activeTab === "completed" && project.status === 'completed')
    return matchesSearch && matchesTab
  })

  const getStatusBadge = (status) => {
    if (status === 'completed') return <span className="project-status status-completed">Completed</span>
    return <span className="project-status status-active">Active</span>
  }

  // Handle logout
  const handleLogout = () => { logout() }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Your Research Hub</h1>
          <p>Collaborate, innovate, and advance scientific knowledge through our comprehensive research platform designed for modern academic excellence.</p>
        </div>
      </section>

      {/* Search other users */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", margin: "0 0 1rem 0" }}>
        <input type="text" placeholder="Search by username..." value={userSearch} onChange={(e)=>setUserSearch(e.target.value)} className="search-input" />
        <button className="create-btn" onClick={searchByUsername}>Search</button>
      </div>
      {userProjects.length > 0 && (
        <div className="projects-section" style={{ marginBottom: "1.5rem" }}>
          <div className="section-header"><h2 className="section-title">Projects by {userSearch}</h2></div>
          <div className="projects-grid">
            {userProjects.map(p => (
              <div key={p.id} className="project-card">
                <div className="project-header"><div><h3 className="project-title">{p.title}</h3>{getStatusBadge(p.status)}</div></div>
                <p className="project-description">{p.description || "No description"}</p>
                <div className="project-meta">
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Owner: {p.owner?.username || "Unknown"}</span>
                  <button onClick={async () => { await api.post(`projects/${p.id}/request_access/`); alert("Access requested") }}
                    style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, marginLeft: "0.5rem" }}>
                    Request access
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header"><div className={`stat-icon ${stat.type}`}>{stat.icon}</div></div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <section className="projects-section">
        <div className="section-header">
          <h2 className="section-title">Your Projects</h2>
          <button className="create-btn" onClick={() => setShowCreateForm(true)}><span>+</span>New Project</button>
        </div>

        {/* Tabs */}
        <div className="project-tabs">
          {['all','active','completed'].map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="controls">
          <input type="text" placeholder="Search projects..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {/* Projects Grid */}
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <div>
                  <h3 className="project-title">{project.title}</h3>
                  {getStatusBadge(project.status)}
                </div>
                {me && project.owner?.id === me.id && (
                  <button onClick={() => handleDelete(project.id)}
                    style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, marginLeft: "0.5rem" }}>
                    Delete
                  </button>
                )}
              </div>

              <p className="project-description">{project.description || "No description"}</p>

              {/* Quick Notes Section */}
              <div className="notes-section" style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input type="text" placeholder="Add a quick note..." defaultValue="" style={{ flex: 1, padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "0.25rem", fontSize: "0.875rem", backgroundColor: "#f8fafc" }}
                    onKeyPress={(e) => { if (e.key === "Enter") { addNote(project.id, e.target.value); e.target.value = "" } }} />
                  <button onClick={(e) => { const input = e.target.previousElementSibling; addNote(project.id, input.value); input.value = "" }} style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" }}>Add</button>
                </div>
                {notes[project.id] && notes[project.id].length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {notes[project.id].map(note => (
                      <div key={note.id} style={{ background: "#e0f2fe", border: "1px solid #0288d1", padding: "0.75rem", marginBottom: "0.5rem", borderRadius: "0.5rem", fontSize: "0.875rem", position: "relative" }}>
                        <div style={{ color: "#01579b", fontSize: "0.75rem", marginBottom: "0.5rem", fontWeight: "500" }}>📝 {note.timestamp}</div>
                        {editingNote === note.id ? (
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} style={{ flex: 1, padding: "0.5rem", border: "1px solid #0288d1", borderRadius: "0.25rem", fontSize: "0.875rem" }} onKeyPress={(e) => e.key === "Enter" && saveEditNote(project.id, note.id)} />
                            <button onClick={() => saveEditNote(project.id, note.id)} style={{ padding: "0.25rem 0.5rem", background: "#10b981", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.75rem" }}>Save</button>
                            <button onClick={cancelEdit} style={{ padding: "0.25rem 0.5rem", background: "#6b7280", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.75rem" }}>Cancel</button>
                </div>
                        ) : (<div style={{ color: "#0d47a1", lineHeight: "1.4" }}>{note.text}</div>)}
                        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", display: "flex", gap: "0.25rem" }}>
                          {editingNote !== note.id && (<button onClick={() => startEditNote(note)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "0.75rem", padding: "0.25rem" }} title="Edit note">✏️</button>)}
                          <button onClick={() => removeNote(project.id, note.id)}
                            style={{ background: "none", border: "none", color: "#222", cursor: "pointer", fontSize: "0.8rem", padding: "0.25rem" }}
                            title="Delete note">🗑️</button>
                </div>
              </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="project-progress">
                <div className="progress-label"><span>Created</span><span>{new Date(project.created_at).toLocaleDateString()}</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: project.status === 'completed' ? '100%' : '50%' }}></div></div>
              </div>

              <div className="project-meta">
                <div className="collaborators"><span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Owner:</span>
                  <div className="collaborator-avatars"><div className="collaborator-avatar" style={{ backgroundColor: "#10b981" }} title={project.owner?.username || "Unknown"}>{(project.owner?.username || "U").charAt(0).toUpperCase()}</div></div>
                </div>
                {project.status !== 'completed' ? (
                  <button onClick={() => handleComplete(project.id)}
                    style={{ padding: "0.5rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>
                    Mark as Completed
                  </button>
                ) : (
                  <span style={{ padding: "0.5rem 1rem", background: "#22c55e", color: "white", borderRadius: "0.25rem", fontSize: "0.875rem", fontWeight: 500 }}>Finished</span>
                )}
              </div>

              {me && project.owner?.id === me.id && (
                <div style={{ marginTop: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                    Incoming Requests ({(incomingByProject[project.id] || []).length})
                  </div>
                  {((incomingByProject[project.id] || []).length === 0) ? (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>No pending requests</div>
                  ) : (
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                      {(incomingByProject[project.id] || []).map((req) => (
                        <div key={req.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.85rem" }}>{req.requester?.username || "User"}</span>
                          <select
                            value={selectedRoles[req.id] || "manager"}
                            onChange={e => setSelectedRoles(prev => ({ ...prev, [req.id]: e.target.value }))}
                            style={{ padding: "0.3rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #d1d5db", fontSize: "0.85rem" }}
                          >
                            <option value="manager">Manager</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button onClick={() => approveRequest(project.id, req.id)}
                            style={{ padding: "0.5rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}>
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
            {projects.length === 0 ? "No projects yet. Create your first research project!" : "No projects found matching your criteria."}
          </div>
        )}

        {/* Project Creation Form Modal */}
        {showCreateForm && (
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h3>Create New Project</h3><button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button></div>
              <form onSubmit={handleCreateProject} className="project-form">
                <div className="form-group"><label htmlFor="title">Project Title *</label><input type="text" id="title" name="title" value={newProject.title} onChange={handleInputChange} placeholder="Enter project title..." required /></div>
                <div className="form-group"><label htmlFor="description">Description *</label><textarea id="description" name="description" value={newProject.description} onChange={handleInputChange} placeholder="Describe your research project..." rows="4" required /></div>
                <div className="form-actions"><button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>Cancel</button><button type="submit" className="submit-btn" disabled={loading}>{loading ? "Creating..." : "Create Project"}</button></div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Projects
