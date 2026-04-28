export interface User {
  user_id: string;
  name: string;
  email: string;
}

export interface Comment {
  feedback_id: string;
  project_id: string;
  user_id?: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface FailureReason {
  reason_type: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  rating: number;
  tags: string[];
  failure_reasons?: FailureReason[];
  comments?: Comment[];
  created_at?: string;
}

export interface ShareProjectPayload {
  title: string;
  category: string;
  description: string;
  status: string;
  tags: string[];
  reason_type: string;
  reason_description: string;
}

export interface IdeaPayload {
  title: string;
  category: string;
  description: string;
  tags: string[];
}

export interface SimilarProject {
  project_id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  avg_rating: number;
  tags: string[];
}

export interface AnalysisResult {
  similar_projects: SimilarProject[];
  analysis: {
    total_similar: number;
    failed_count: number;
    success_count: number;
    active_count: number;
    success_rate: number;
    avg_community_rating: number;
    prediction_score: number;
    risk_level: 'Low' | 'Medium' | 'High';
    insights: string[];
  };
}

export const AVAILABLE_TAGS = [
  "saas", "b2b", "b2c", "ai", "crypto", "blockchain", "fintech",
  "edtech", "healthtech", "social", "e-commerce", "marketplace",
  "gig-economy", "logistics", "productivity", "gaming", "web3",
  "hardware", "vr/ar", "sustainability", "real-estate", "travel",
  "foodtech", "agritech", "cybersecurity", "analytics", "low-code",
  "dev-tools", "dating", "pets", "fitness", "enterprise"
];

export const AVAILABLE_CATEGORIES = [
  'EdTech', 'E-Commerce', 'HealthTech', 'FinTech', 'Logistics', 
  'AgriTech', 'Travel', 'GovTech', 'Retail', 'Transport', 'Media'
];

export const FAILURE_TYPES = [
  'Technical', 'Market', 'Execution', 'Financial'
];

// API points to the same domain on Vercel
const API_BASE_URL = '/api';

export async function fetchProjects(searchQuery: string = "", category: string = ""): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/explore`);
    if (!res.ok) throw new Error("Failed to fetch projects");
    
    let results = await res.json();
    
    results = results.map((p: any) => ({
      id: p.project_id.toString(),
      title: p.title,
      category: p.category,
      status: p.status,
      rating: parseFloat(p.avg_feedback_rating || 0),
      description: p.description || "No description provided.",
      tags: p.tags || [],
      failure_reasons: []
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((p: Project) => 
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (category && category !== "All") {
      results = results.filter((p: Project) => p.category === category);
    }
    return results;
  } catch (error) {
    console.error("Error fetching from API:", error);
    return [];
  }
}

export async function fetchProjectById(projectId: string): Promise<Project | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/project/${projectId}`);
    if (!res.ok) throw new Error("Failed to fetch project details");
    
    const p = await res.json();
    return {
      id: p.project_id.toString(),
      title: p.title,
      category: p.category_name,
      status: p.status,
      rating: p.avg_rating || 0,
      description: p.description,
      tags: p.tags || [],
      failure_reasons: p.failure_reasons || [],
      comments: p.comments || [],
      created_at: p.created_at
    };
  } catch (error) {
    console.error("Error fetching project details:", error);
    return null;
  }
}

export async function analyzeIdea(ideaData: IdeaPayload): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: ideaData.title,
      description: ideaData.description,
      category: ideaData.category,
      tags: ideaData.tags
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
    throw new Error(err.error || 'Analysis failed');
  }

  return await res.json();
}

// Keep backward compat — submitIdea now calls analyzeIdea
export async function submitIdea(ideaData: IdeaPayload): Promise<{ success: boolean; message: string }> {
  try {
    await analyzeIdea(ideaData);
    return { success: true, message: "Analysis complete!" };
  } catch {
    return { success: false, message: "Analysis failed." };
  }
}

export async function shareProject(projectData: ShareProjectPayload, user_id?: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/submit_idea`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: projectData.title,
        description: projectData.description,
        category_name: projectData.category,
        failure_type: projectData.reason_type,
        reason_desc: projectData.reason_description,
        tags: projectData.tags
      })
    });
    
    if (!res.ok) throw new Error("API responded with an error");
    const data = await res.json();
    
    return {
      success: true,
      message: data.message || "Your project has been successfully logged into the database."
    };
  } catch (error) {
    console.error("Error submitting project:", error);
    throw error;
  }
}

export async function postComment(projectId: string, userId: string | undefined, rating: number, comment: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: projectId,
        user_id: userId || null,
        rating,
        comment
      })
    });
    return res.ok;
  } catch (error) {
    console.error("Error posting comment:", error);
    return false;
  }
}

export async function registerMockUser(name: string, email: string): Promise<User> {
  try {
    const res = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email })
    });
    
    if (!res.ok) throw new Error("API responded with an error");
    const data = await res.json();
    
    return {
      user_id: data.user_id.toString(),
      name,
      email
    };
  } catch (error) {
    console.error("Error Registering user, falling back to mock:", error);
    return {
      user_id: `u-${Math.floor(Math.random() * 10000)}`,
      name,
      email
    };
  }
}
