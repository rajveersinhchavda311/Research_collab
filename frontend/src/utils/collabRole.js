import api from "../api";

// Get the current user's collaborator role for a project
export async function fetchMyCollaboratorRole(projectId, user) {
  try {
    const { data } = await api.get(`/collaborators/?project=${projectId}`);
    if (!user) return null;
    // API now returns only the current user's collaborator entry for this project
    return data.length === 1 ? data[0].role : null;
  } catch (e) {
    console.error('Error fetching role:', e);
    return null;
  }
}
