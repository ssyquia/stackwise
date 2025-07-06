import { supabase } from './supabase';
import { Node, Edge } from '@xyflow/react';

// Type for version history items (matching your existing interface)
export interface VersionHistoryEntry {
  id: string;
  timestamp: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

// Type for database graph entry
export interface DatabaseGraph {
  id: string;
  user_id: string;
  name: string;
  data: {
    nodes: Node[];
    edges: Edge[];
  };
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = 'techStackGraphHistory';

class GraphStorageService {
  private userId: string | null = null;

  setUser(user: any) {
    this.userId = user?.id || null;
  }

  async saveGraph(graphData: { nodes: Node[]; edges: Edge[] }, name?: string): Promise<string> {
    if (this.userId) {
      console.log('Attempting to save graph to Supabase...', { userId: this.userId, name, graphData });
      // Save to Supabase
      const { data, error } = await supabase
        .from('graphs')
        .insert({
          user_id: this.userId,
          name: name || `Graph ${new Date().toLocaleString()}`,
          data: graphData,
        })
        .select()
        .single();
      if (error) {
        console.error('Supabase save error:', error);
        throw error;
      }
      console.log('Graph saved to Supabase successfully:', data);
      return data.id;
    } else {
      console.log('Saving graph to localStorage (not logged in)...');
      // Save to localStorage
      const history = this.loadFromLocalStorage();
      const newVersion: VersionHistoryEntry = {
        id: `version_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        description: name || `Version ${history.length + 1}`,
        nodes: graphData.nodes,
        edges: graphData.edges,
      };
      const updatedHistory = [...history, newVersion];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
      return newVersion.id;
    }
  }

  async loadGraphs(): Promise<VersionHistoryEntry[]> {
    if (this.userId) {
      console.log('Attempting to load graphs from Supabase...', { userId: this.userId });
      // Load from Supabase
      const { data, error } = await supabase
        .from('graphs')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Supabase load error:', error);
        throw error;
      }
      console.log('Graphs loaded from Supabase successfully:', data);
      return (data || []).map((dbGraph: any) => ({
        id: dbGraph.id,
        timestamp: new Date(dbGraph.created_at).toLocaleString(),
        description: dbGraph.name,
        nodes: dbGraph.data.nodes,
        edges: dbGraph.data.edges,
      }));
    } else {
      // Load from localStorage
      return this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage(): VersionHistoryEntry[] {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          if (Array.isArray(parsedHistory)) return parsedHistory;
        } catch {}
      }
    }
    return [{
      id: 'initial',
      timestamp: new Date().toLocaleString(),
      description: 'Initial Version',
      nodes: [],
      edges: [],
    }];
  }

  // Delete a specific graph
  async deleteGraph(graphId: string): Promise<void> {
    if (this.userId) {
      await this.deleteFromSupabase(graphId);
    } else {
      this.deleteFromLocalStorage(graphId);
    }
  }

  // Delete from Supabase
  private async deleteFromSupabase(graphId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('graphs')
        .delete()
        .eq('id', graphId)
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error deleting from Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete from Supabase:', error);
      throw error;
    }
  }

  // Delete from localStorage
  private deleteFromLocalStorage(graphId: string): void {
    const history = this.loadFromLocalStorage();
    const updatedHistory = history.filter(version => version.id !== graphId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
  }

  // Update existing graph (for when user modifies a saved graph)
  async updateGraph(graphId: string, graphData: { nodes: Node[]; edges: Edge[] }): Promise<void> {
    if (this.userId) {
      await this.updateInSupabase(graphId, graphData);
    } else {
      this.updateInLocalStorage(graphId, graphData);
    }
  }

  // Update in Supabase
  private async updateInSupabase(graphId: string, graphData: { nodes: Node[]; edges: Edge[] }): Promise<void> {
    try {
      const { error } = await supabase
        .from('graphs')
        .update({
          data: graphData,
          updated_at: new Date().toISOString()
        })
        .eq('id', graphId)
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error updating in Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update in Supabase:', error);
      throw error;
    }
  }

  // Update in localStorage
  private updateInLocalStorage(graphId: string, graphData: { nodes: Node[]; edges: Edge[] }): void {
    const history = this.loadFromLocalStorage();
    const updatedHistory = history.map(version => {
      if (version.id === graphId) {
        return { ...version, nodes: graphData.nodes, edges: graphData.edges };
      }
      return version;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
  }

  // Sync localStorage to Supabase (when user logs in)
  async syncLocalToSupabase(): Promise<void> {
    if (!this.userId) {
      return;
    }

    const localHistory = this.loadFromLocalStorage();
    
    // Skip the initial empty version
    const graphsToSync = localHistory.filter(version => 
      version.id !== 'initial' && (version.nodes.length > 0 || version.edges.length > 0)
    );

    for (const graph of graphsToSync) {
      try {
        await this.saveGraph(
          { nodes: graph.nodes, edges: graph.edges },
          graph.description
        );
      } catch (error) {
        console.error(`Failed to sync graph ${graph.id}:`, error);
      }
    }

    // Clear localStorage after successful sync
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

// Export singleton instance
export const graphStorage = new GraphStorageService(); 