"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../AuthContext"
import api from "../api"

const Projects = () => {
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [bib, setBib] = useState("")

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
    console.log('Saving notes to localStorage:', notes)
    if (Object.keys(notes).length > 0) {
      localStorage.setItem('projectNotes', JSON.stringify(notes))
    }
  }, [notes])

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
          console.log('Loading saved notes after projects:', parsedNotes)
          
          // Merge saved notes with project structure
          const mergedNotes = { ...parsedNotes }
          data.forEach(project => {
            if (!mergedNotes[project.id]) {
              mergedNotes[project.id] = []
            }
          })
          
          setNotes(mergedNotes)
        } catch (error) {
          console.error('Error loading saved notes:', error)
          // Fallback: initialize empty notes
          const initialNotes = {}
          data.forEach(project => {
            initialNotes[project.id] = []
          })
          setNotes(initialNotes)
        }
      } else {
        // No saved notes, initialize empty
        const initialNotes = {}
        data.forEach(project => {
          initialNotes[project.id] = []
        })
        setNotes(initialNotes)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  useEffect(() => { 
    fetchProjects() 
  }, [])

  // Create real project in Django backend
  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProject.title.trim() || !newProject.description.trim()) {
      alert("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      await api.post("projects/", { 
        title: newProject.title, 
        description: newProject.description 
      })
      setNewProject({ title: "", description: "", tags: "" })
      setShowCreateForm(false)
      await fetchProjects() // Refresh the list
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Error creating project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // View bibliography from Django backend
  const viewBibliography = async (projectId) => {
    try {
      setBib("Loading...")
      const { data } = await api.get(`projects/${projectId}/bibliography/`)
      setBib(data.bibliography || "(No entries)")
    } catch (error) {
      console.error("Error fetching bibliography:", error)
      setBib("Error loading bibliography")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewProject((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Add note to project
  const addNote = (projectId, noteText) => {
    if (!noteText.trim()) return
    
    const note = {
      id: Date.now(),
      text: noteText,
      timestamp: new Date().toLocaleString(),
    }
    
    setNotes(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), note]
    }))
  }

  // Start editing note
  const startEditNote = (note) => {
    setEditingNote(note.id)
    setEditText(note.text)
  }

  // Save edited note
  const saveEditNote = (projectId, noteId) => {
    if (!editText.trim()) return
    
    setNotes(prev => ({
      ...prev,
      [projectId]: prev[projectId].map(note => 
        note.id === noteId ? { ...note, text: editText } : note
      )
    }))
    setEditingNote(null)
    setEditText("")
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingNote(null)
    setEditText("")
  }

  // Remove note
  const removeNote = (projectId, noteId) => {
    setNotes(prev => ({
      ...prev,
      [projectId]: prev[projectId].filter(note => note.id !== noteId)
    }))
  }

  // Calculate stats from real data
  const stats = [
    {
      label: "Active Projects",
      value: projects.length.toString(), // All projects are active by default
      icon: "📊",
      type: "projects",
    },
    { label: "Total Projects", value: projects.length.toString(), icon: "👥", type: "collaborators" },
    { label: "Completed", value: "0", icon: "📄", type: "publications" },
    { label: "Draft", value: "0", icon: "📈", type: "citations" },
  ]

  // Filter projects based on search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Since Django projects don't have status, treat all as active
    const matchesStatus = filterStatus === "all" || filterStatus === "active"
    const matchesTab = activeTab === "all" || activeTab === "active"

    return matchesSearch && matchesStatus && matchesTab
  })

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "status-active"
      case "completed":
        return "status-completed"
      case "draft":
        return "status-draft"
      default:
        return "status-active"
    }
  }

  // Handle logout
  const handleLogout = () => {
    logout()
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Your Research Hub</h1>
          <p>
            Collaborate, innovate, and advance scientific knowledge through our comprehensive research platform designed
            for modern academic excellence.
          </p>
        </div>
      </section>

      {/* Statistics */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <div className={`stat-icon ${stat.type}`}>{stat.icon}</div>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <section className="projects-section">
        <div className="section-header">
          <h2 className="section-title">Research Projects</h2>
          <button className="create-btn" onClick={() => setShowCreateForm(true)}>
            <span>+</span>
            New Project
          </button>
        </div>

        {/* Tabs */}
        <div className="project-tabs">
          {["all", "active", "completed", "draft"].map((tab) => (
            <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="controls">
          <input
            type="text"
            placeholder="Search projects..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Projects Grid */}
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <div>
                  <h3 className="project-title">{project.title}</h3>
                  <span className="project-status status-active">
                    Active
                  </span>
                </div>
              </div>

              <p className="project-description">{project.description || "No description"}</p>

              {/* Quick Notes Section */}
              <div className="notes-section" style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Add a quick note..."
                    defaultValue=""
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.25rem",
                      fontSize: "0.875rem",
                      backgroundColor: "#f8fafc"
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addNote(project.id, e.target.value)
                        e.target.value = "" // Clear input after adding
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousElementSibling
                      addNote(project.id, input.value)
                      input.value = "" // Clear input after adding
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "500"
                    }}
                  >
                    Add
                  </button>
                </div>
                
                {/* Display Notes */}
                {notes[project.id] && notes[project.id].length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {notes[project.id].map(note => (
                      <div key={note.id} style={{
                        background: "#e0f2fe",
                        border: "1px solid #0288d1",
                        padding: "0.75rem",
                        marginBottom: "0.5rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        position: "relative"
                      }}>
                        <div style={{ color: "#01579b", fontSize: "0.75rem", marginBottom: "0.5rem", fontWeight: "500" }}>
                          📝 {note.timestamp}
                        </div>
                        
                        {editingNote === note.id ? (
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              style={{
                                flex: 1,
                                padding: "0.5rem",
                                border: "1px solid #0288d1",
                                borderRadius: "0.25rem",
                                fontSize: "0.875rem"
                              }}
                              onKeyPress={(e) => e.key === "Enter" && saveEditNote(project.id, note.id)}
                            />
                            <button
                              onClick={() => saveEditNote(project.id, note.id)}
                              style={{
                                padding: "0.25rem 0.5rem",
                                background: "#10b981",
                                color: "white",
                                border: "none",
                                borderRadius: "0.25rem",
                                cursor: "pointer",
                                fontSize: "0.75rem"
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{
                                padding: "0.25rem 0.5rem",
                                background: "#6b7280",
                                color: "white",
                                border: "none",
                                borderRadius: "0.25rem",
                                cursor: "pointer",
                                fontSize: "0.75rem"
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ color: "#0d47a1", lineHeight: "1.4" }}>
                            {note.text}
                          </div>
                        )}
                        
                        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", display: "flex", gap: "0.25rem" }}>
                          {editingNote !== note.id && (
                            <button
                              onClick={() => startEditNote(note)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#3b82f6",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                padding: "0.25rem"
                              }}
                              title="Edit note"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            onClick={() => removeNote(project.id, note.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              padding: "0.25rem"
                            }}
                            title="Delete note"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="project-progress">
                <div className="progress-label">
                  <span>Created</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "100%" }}></div>
                </div>
              </div>

              <div className="project-tags">
                {project.tags && project.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="project-meta">
                <div className="collaborators">
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Owner:</span>
                  <div className="collaborator-avatars">
                    <div
                      className="collaborator-avatar"
                      style={{ backgroundColor: "#10b981" }}
                      title={project.owner?.username || "Unknown"}
                    >
                      {(project.owner?.username || "U").charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => viewBibliography(project.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors"
                  style={{ fontSize: "0.75rem" }}
                >
                  Bibliography
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--text-secondary)",
            }}
          >
            {projects.length === 0 ? "No projects yet. Create your first research project!" : "No projects found matching your criteria."}
          </div>
        )}

        {/* Project Creation Form Modal */}
        {showCreateForm && (
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create New Project</h3>
                <button className="close-btn" onClick={() => setShowCreateForm(false)}>
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="project-form">
                <div className="form-group">
                  <label htmlFor="title">Project Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newProject.title}
                    onChange={handleInputChange}
                    placeholder="Enter project title..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newProject.description}
                    onChange={handleInputChange}
                    placeholder="Describe your research project..."
                    rows="4"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tags">Tags (comma-separated)</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={newProject.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., Machine Learning, Data Science, AI"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Bibliography Display */}
      {bib && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bibliography</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{bib}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default Projects
