import os
import json
import textwrap
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv # Keep import
import google.generativeai as genai

app = Flask(__name__)
# Allow requests from frontend (adjust origin if your frontend runs elsewhere)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:8080", "http://localhost:8081"]}}) # Add both ports just in case

# --- Gemini API Setup ---
def setup_gemini_api():
    """Configure and initialize the Gemini API model.
    Explicitly loads .env inside the function with override=True.
    """
    try:
        # --- Explicitly load .env from the script's directory --- 
        script_dir = os.path.dirname(__file__)
        dotenv_path = os.path.join(script_dir, '.env')
        # print(f"--- DEBUG: Explicitly loading .env from: {dotenv_path} with override=True ---")
        loaded = load_dotenv(dotenv_path=dotenv_path, override=True)
        # if not loaded:
            # print(f"--- WARNING: load_dotenv did not find file at: {dotenv_path} ---")
        # --------------------------------------------------------

        # Retrieve the key AFTER the explicit load_dotenv call
        api_key = os.getenv("GEMINI_API_KEY") 
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables (check .env and ensure it was loaded)." ) 
            
        genai.configure(api_key=api_key)

        # Initialize the model exactly as in detail-generator.py
        model_name = 'gemini-2.5-flash-preview-04-17'
        model = genai.GenerativeModel(model_name)
        
        print(f"Using {model_name} model") 
        print(f"Gemini API configured successfully with model: {model.model_name} (using key from environment)")
        return model
        
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
        return None

gemini_model = setup_gemini_api()

# --- Fallback Mock Function --- (Adapted from json-generator.py)
def create_mock_tech_stack(description):
    """Create a simple mock tech stack graph when API fails."""
    print(f"Creating mock tech stack as fallback for description: {description[:50]}...")
    # Basic structure compatible with React Flow
    nodes = [
        {
            "id": "mock_node_react",
            "type": "techNode",
            "position": {"x": 100, "y": 100},
            "data": {"label": "React", "type": "frontend", "details": ""}
        },
        {
            "id": "mock_node_flask",
            "type": "techNode",
            "position": {"x": 100, "y": 300},
            "data": {"label": "Flask", "type": "backend", "details": "PORT=5001"}
        },
        {
            "id": "mock_node_postgres",
            "type": "techNode",
            "position": {"x": 400, "y": 300},
            "data": {"label": "PostgreSQL", "type": "database", "details": "DB_URL=..."}
        }
    ]
    edges = [
        {
            "id": "mock_edge_react_flask",
            "source": "mock_node_react",
            "target": "mock_node_flask",
            "type": "default",
            "markerEnd": {"type": "arrowclosed"}
        },
        {
            "id": "mock_edge_flask_postgres",
            "source": "mock_node_flask",
            "target": "mock_node_postgres",
            "type": "default",
            "markerEnd": {"type": "arrowclosed"}
        }
    ]
    return {"nodes": nodes, "edges": edges, "mocked": True} # Add flag to indicate mock data

# --- Helper: Generate Graph from Description (with DETAILS included) ---
def generate_tech_stack_graph(description):
    """Uses Gemini to generate a tech stack graph JSON (React Flow format)
       based on description, including DETAILED DESCRIPTIONS in the nodes.
    """
    if not gemini_model:
        print("Gemini model not initialized, using mock fallback.")
        return create_mock_tech_stack(description)

    # --- UPDATED PROMPT --- 
    # Asks for React Flow format AND detailed descriptions within data.details
    prompt = textwrap.dedent(f"""
    You are a senior software architect designing a tech stack diagram for a web application.
    Based on the project description below, generate a tech stack graph.

    Project description: {description}

    Return ONLY a valid JSON object with this exact structure compatible with React Flow:
    {{
      "nodes": [
        {{
          "id": "node_unique_string_id_1",  // Unique STRING ID (e.g., "node_react", "node_postgres")
          "type": "techNode",              // Default node type for React Flow
          "position": {{ "x": 100, "y": 200 }}, // REQUIRED x/y position
          "data": {{                    // Data payload for the node
            "label": "Component Name",   // The display name (e.g., "React", "PostgreSQL")
            "type": "frontend|backend|database|api|deployment|custom", // Categorical type
            "details": "Detailed description of this component..." // DETAILED DESCRIPTION HERE
          }}
        }}
        // ... more nodes
      ],
      "edges": [
        {{
          "id": "edge_unique_string_id_1", // Unique STRING ID (e.g., "edge_react_to_api")
          "source": "node_react_id",           // Source node STRING ID
          "target": "node_api_id",             // Target node STRING ID
          "type": "default",                 // Optional: React Flow edge type
          "markerEnd": {{ "type": "arrowclosed" }} // Add arrowheads
        }}
        // ... more edges
      ]
    }}

    Instructions for Generation:
    1. Include logical components for the stack: Frontend frameworks, Backend frameworks, Databases, important APIs/Services, Deployment targets.
    2. Assign a relevant categorical `type` within the `data` object (frontend, backend, database, api, deployment, custom).
    3. Position nodes logically using `position.x` and `position.y` (e.g., within 0-1000 canvas units).
    4. Create edges between related components (frontend -> backend, backend -> database, etc.). Ensure `source` and `target` use the correct string `id`s of the nodes.
    5. Use descriptive, unique STRING `id`s for both nodes and edges.
    6. **IMPORTANT for `data.details`**: For EACH node, provide key technical specifications relevant to this project, focusing on versions, specific configurations, or sub-components. Avoid generic descriptions or environment variables. Examples:
        - API Node (e.g., Gemini API): Model name ('gemini-1.5-pro-latest'), specific API endpoint used.
        - Database Node (e.g., MongoDB): Version (e.g., '7.0'), specific collection name ('orders'), maybe a key configuration aspect (e.g., 'sharded cluster').
        - Backend Node (e.g., Node.js): Runtime version ('v20.x'), key framework used ('Express 5').
        - Frontend Node (e.g., React): Library version ('18.2'), specific architecture used ('Vite build', 'Next.js App Router').
        - Deployment Node (e.g., AWS): Specific service and tier/type ('EC2 t3.medium', 'S3 Standard bucket').
       Keep the details concise and focused on specifications. If a specific version or configuration isn't implied by the description, provide a typical or latest stable version as a sensible default.
    7. Ensure the final output is ONLY the JSON object, with no surrounding text or explanations. Before returning the JSON, make sure to check that it is valid.
    """)
    # --- END UPDATED PROMPT ---

    try:
        print("Sending prompt to Gemini for graph generation (with details)...")
        response = gemini_model.generate_content(prompt)

        # Handle potential safety blocks or empty responses
        if not response.parts:
            feedback = response.prompt_feedback
            print(f"Warning: Gemini response blocked or empty. Feedback: {feedback}")
            # Fallback to mock if blocked/empty
            print("Gemini response blocked/empty, using mock fallback.")
            return create_mock_tech_stack(description)

        response_text = response.text
        print("Received response text from Gemini (React Flow format expected).")

        # Attempt to extract JSON cleanly
        tech_stack = None
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end != 0:
                json_str = response_text[json_start:json_end]
                tech_stack = json.loads(json_str)
            else:
                 raise ValueError("No JSON object structure found in response.")
        except (json.JSONDecodeError, ValueError) as json_e:
            print(f"JSON Decode Error (React Flow format): {json_e}")
            print(f"Response Text causing error:\n---\n{response_text}\n---")
            # Fallback to mock if JSON is invalid
            print(f"Invalid JSON from Gemini ({json_e}), using mock fallback.")
            return create_mock_tech_stack(description)

        # Basic validation of the parsed structure
        if not isinstance(tech_stack.get('nodes'), list) or not isinstance(tech_stack.get('edges'), list):
             print("Generated JSON has incorrect structure, using mock fallback.")
             return create_mock_tech_stack(description)

        # --- NO LONGER NEED CONVERSION --- 
        # The prompt now asks directly for the React Flow format with details.
        
        print(f"Successfully generated and parsed graph data (with details) for: {description[:50]}...")
        return tech_stack # Return the data directly
        
    except Exception as e:
        # Catch-all for other Gemini/network errors
        print(f"Error during Gemini call or processing: {e}, using mock fallback.")
        return create_mock_tech_stack(description) # Use mock for other errors

# --- Helper: Generate Explanation for Graph ---
def generate_graph_explanation(graph_json, original_prompt):
    """Uses Gemini to generate an explanation for a given tech stack graph JSON,
       considering the original user prompt.
    """
    if not gemini_model:
        print("Gemini model not initialized. Cannot generate explanation.")
        return "Error: AI model not available to generate explanation."

    try:
        graph_str = json.dumps(graph_json, indent=2)
    except TypeError:
        graph_str = str(graph_json) 
        print("Warning: Could not serialize graph to JSON for explanation prompt.")

    # --- Updated Prompt with Original Context --- 
    prompt = textwrap.dedent(f"""
    You are a helpful AI assistant explaining a generated tech stack diagram.
    The diagram was generated based on the following user request:
    \"""{original_prompt}"\""

    Here is the generated tech stack graph data (in React Flow JSON format):
    ```json
    {graph_str}
    ```

    Explain the choices made for the components in this tech stack **in the context of the original user request**.
    Describe why each component (node) might have been chosen and how they connect (edges) to fulfill the user's goal.
    Focus on the relationships and the overall architecture suggested by the graph.
    Keep the explanation concise and easy to understand.
    Do not output JSON, only the textual explanation.
    """)
    # --- End Updated Prompt ---

    try:
        print(f"Sending prompt to Gemini for graph explanation (with context: {original_prompt[:50]}...)") # Log context
        response = gemini_model.generate_content(prompt)

        # Handle potential safety blocks or empty responses
        if not response.parts:
            feedback = response.prompt_feedback
            print(f"Warning: Gemini explanation response blocked or empty. Feedback: {feedback}")
            return "AI explanation was blocked or empty."

        explanation_text = response.text
        print("Received explanation text from Gemini.")
        return explanation_text
        
    except Exception as e:
        print(f"Error during Gemini call for explanation: {e}")
        return f"Error generating explanation: {e}"

# --- API Endpoints ---

@app.route('/api/generate-graph', methods=['POST'])
def api_generate_graph():
    """Endpoint to generate a tech stack graph from a text description.
       The generated graph now includes details within each node's data.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    description = data.get('description')
    if not description:
        return jsonify({"error": "Missing 'description' in request body"}), 400

    if not gemini_model:
         return jsonify({"error": "Gemini API not configured on server."}), 503

    try:
        # Calls the updated function which now includes details
        generated_data = generate_tech_stack_graph(description)
        
        # Check if mock data was returned (e.g., due to API error)
        # Frontend might want to know if the data is real or mocked
        is_mocked = generated_data.pop('mocked', False) # Remove flag if present
        if is_mocked:
            print("Returning mocked graph data due to generation failure.")
            # Optionally add a flag back for the frontend, or just return mock data
            # generated_data['is_mocked'] = True 
        
        # Check for errors returned within the data (handled internally now)
        # if "error" in generated_data: 
        #     print(f"Graph generation failed: {generated_data['error']}")
        #     return jsonify({"error": f"Failed to generate graph via AI: {generated_data['error']}"}), 500
            
        return jsonify(generated_data), 200
    except ConnectionError as e:
         # This might still happen if setup_gemini_api failed initially
         return jsonify({"error": str(e)}), 503
    except Exception as e:
        print(f"Unexpected error in /api/generate-graph: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/api/explain-graph', methods=['POST'])
def api_explain_graph():
    """Endpoint to generate an explanation for a given tech stack graph JSON,
       using the original user prompt for context.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    data = request.get_json()
    graph_data = data.get('graphData')
    original_prompt = data.get('originalPrompt')

    if not graph_data or 'nodes' not in graph_data or 'edges' not in graph_data:
        return jsonify({"error": "Invalid or missing graph data in request body"}), 400
    if not original_prompt:
         return jsonify({"error": "Missing originalPrompt in request body"}), 400

    if not gemini_model:
         return jsonify({"error": "Gemini API not configured on server."}), 503

    try:
        # Pass both graph and original prompt to the helper
        explanation = generate_graph_explanation(graph_data, original_prompt)
        
        # Check for errors returned within the data (handled internally now)
        # if "error" in explanation: 
        #     print(f"Explanation generation failed: {explanation['error']}")
        #     return jsonify({"error": f"Failed to generate explanation: {explanation['error']}"}), 500
            
        return jsonify({"explanation": explanation}), 200
    except Exception as e:
        print(f"Unexpected error in /api/explain-graph: {e}")
        return jsonify({"error": "An internal server error occurred during explanation."}), 500

@app.route('/')
def health_check():
    """Basic health check endpoint."""
    return jsonify({"status": "ok", "message": "Flask backend is running."})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
