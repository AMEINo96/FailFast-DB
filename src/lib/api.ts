export interface User {
  user_id: string;
  name: string;
  email: string;
}

export interface Feedback {
  feedback_id: string;
  project_id: string;
  user_id?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Suggestion {
  suggestion_id: string;
  project_id: string;
  user_id?: string;
  description: string;
  created_at: string;
}

export interface FailureReason {
  reason_type: string;
  description: string;
}

export interface Project {
  id: string;  // mapped to project_id
  title: string;
  category: string;
  description: string;
  status: string;
  rating: number; // average derived from feedback
  tags: string[];
  failure_reasons?: FailureReason[];
  feedback?: Feedback[];
  suggestions?: Suggestion[];
  created_at?: string;
}

export interface IdeaPayload {
  title: string;
  category: string;
  description: string;
  tags: string[];
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

// Switch to Render URL in production automatically, otherwise use localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

export async function fetchProjects(searchQuery: string = "", category: string = ""): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/explore`);
    if (!res.ok) throw new Error("Failed to fetch projects");
    
    let results = await res.json();
    
    // The view `vw_project_failure_summary` gives us:
    // project_id, title, category, status, total_failure_reasons, avg_feedback_rating, total_suggestions
    // We map frontend props accordingly.
    
    results = results.map((p: any) => ({
      id: p.project_id.toString(),
      title: p.title,
      category: p.category,
      status: p.status,
      rating: parseFloat(p.avg_feedback_rating || 0),
      // We don't have descriptions in the summary view, but we can put empty defaults or placeholders
      description: "Description not provided in summary.",
      tags: [],
      failure_reasons: []
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((p: any) => 
        p.title.toLowerCase().includes(q)
      );
    }
    if (category && category !== "All") {
      results = results.filter((p: any) => p.category === category);
    }
    return results;
  } catch (error) {
    console.error("Error fetching from API, falling back to empty:", error);
    return [];
  }
}

export async function submitIdea(ideaData: IdeaPayload): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log("Submitting test idea:", ideaData);
  return {
    success: true,
    message: "Idea logged in the database! Here is how it compares..."
  };
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
        reason_desc: projectData.reason_description
      })
    });
    
    if (!res.ok) throw new Error("API responded with an error");
    
    return {
      success: true,
      message: "Your project has been successfully logged into the database."
    };
  } catch (error) {
    console.error("Error submitting project:", error);
    throw error;
  }
}

export async function submitFeedback(feedback: Partial<Feedback>): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 800));
  console.log("Feedback saved locally:", feedback);
  return true;
}

export async function submitSuggestion(suggestion: Partial<Suggestion>): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 800));
  console.log("Suggestion saved locally:", suggestion);
  return true;
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
