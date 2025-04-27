import os
import json
import textwrap
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv # Keep import
import google.generativeai as genai
import traceback # Import traceback for better error logging

# --- Import generator functions ---
# from prompt_generator import format_prompt_from_data # Keep if still used
from llm_prompt_builder import generate_llm_builder_prompt # Import the new function
from repo_builder import generate_repo_builder_script_with_gemini # Import repo builder function
# ----------------------------------

app = Flask(__name__)
# Allow requests from frontend (adjust origin if your frontend runs elsewhere)
# More explicit CORS setup
# --- CORS Setup ---

# Load frontend URL from environment variable
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")  # fallback for local dev

CORS(app, resources={
    r"/api/*": {
        "origins": [frontend_url],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

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
        model_name = 'gemini-1.5-flash-latest'
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

# --- Helper: Generate Graph from Scratch ---
def generate_graph_from_scratch(description):
    """Uses Gemini to generate a NEW tech stack graph JSON from a description."""
    if not gemini_model:
        print("Gemini model not initialized, using mock fallback.")
        return create_mock_tech_stack(description)

    # --- PROMPT FOR NEW GRAPH --- 
    prompt = textwrap.dedent(f"""
    You are a senior software architect designing a tech stack diagram for a web application.
    Based *only* on the project description below, generate a *complete* tech stack graph.

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
    1. Include logical components: Frontend, Backend, Databases, APIs/Services, Deployment.
    2. Assign relevant categorical `type`.
    3. Position nodes logically (0-1000 units).
    4. Create edges between related components.
    5. Use descriptive, unique STRING `id`s.
    6. **IMPORTANT for `data.details`**: Provide key technical specifications (versions, configurations, sub-components). Avoid generic descriptions. (Examples as before)
    7. Ensure the final output is ONLY the valid JSON object.
    """)
    # --- END PROMPT --- 

    try:
        print(f"Sending prompt to Gemini for NEW graph generation: {description[:50]}...")
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

        print(f"Successfully generated NEW graph for: {description[:50]}...")
        return tech_stack # Return the data directly
        
    except Exception as e:
        # Catch-all for other Gemini/network errors
        print(f"Error during Gemini call or processing: {e}, using mock fallback.")
        return create_mock_tech_stack(description) # Use mock for other errors

# --- Helper: Modify or Replace Graph ---
def modify_or_replace_graph(existing_graph_json, user_request):
    """Uses Gemini to modify an existing graph based on a user request, 
       OR generates a new graph if the request is fundamentally different."""
    if not gemini_model:
        print("Gemini model not initialized, using mock fallback.")
        # Maybe return the existing graph instead of mock? Or mock?
        return create_mock_tech_stack(user_request) # Or return existing_graph_json?

    try:
        existing_graph_str = json.dumps(existing_graph_json, indent=2)
    except TypeError:
        existing_graph_str = str(existing_graph_json) 
        print("Warning: Could not serialize existing graph to JSON for modification prompt.")

    # --- PROMPT FOR MODIFICATION/REPLACEMENT --- 
    prompt = textwrap.dedent(f"""
    You are a senior software architect updating a tech stack diagram.
    You are given an existing tech stack graph and a user request.

    Existing tech stack graph (React Flow JSON format):
    ```json
    {existing_graph_str}
    ```

    User request: "{user_request}"

    Analyze the user request in the context of the *existing* graph.
    
    1. **Modification Task:** If the request asks for a specific change, addition, or removal related to the *current* tech stack (e.g., 'change the database to MongoDB', 'add Redis for caching', 'use Next.js instead of Create React App'), modify the *existing* graph JSON minimally to fulfill the request. Update node labels, types, details, positions, and edges as necessary. Ensure IDs remain consistent where possible, but generate new unique IDs for new nodes/edges.
    
    2. **Replacement Task:** If the user request describes a *completely different* application or a fundamental architectural shift unrelated to the current graph (e.g., the current graph is for a 'Twitter clone' and the request is 'create a mini reddit', or 'design an e-commerce backend'), then **ignore the existing graph** and generate a brand new, complete graph based *only* on the user request.

    **Output Format:**
    Return ONLY the resulting valid JSON object (either modified or brand new) with the exact structure compatible with React Flow:
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
    Ensure `data.details` contains relevant technical specifications (versions, configs, etc.).
    Ensure the final output is ONLY the valid JSON object.
    """)
    # --- END PROMPT --- 

    try:
        print(f"Sending prompt to Gemini for graph MODIFICATION/REPLACEMENT: {user_request[:50]}...")
        response = gemini_model.generate_content(prompt)

        # Handle potential safety blocks or empty responses
        if not response.parts:
             # ... (handle blocked/empty) ...
             return create_mock_tech_stack(user_request) # Or return existing_graph_json?
        response_text = response.text
        # ... (JSON extraction logic) ...
        tech_stack = None
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end != 0:
                json_str = response_text[json_start:json_end]
                tech_stack = json.loads(json_str)
            else: raise ValueError("No JSON object found...")
        except (json.JSONDecodeError, ValueError) as json_e:
             # ... (handle JSON error) ...
             return create_mock_tech_stack(user_request) # Or return existing_graph_json?
        # ... (validation) ...
        if not isinstance(tech_stack.get('nodes'), list) or not isinstance(tech_stack.get('edges'), list):
              return create_mock_tech_stack(user_request) # Or return existing_graph_json?
        print(f"Successfully generated MODIFIED/REPLACED graph for: {user_request[:50]}...")
        return tech_stack
        
    except Exception as e:
        print(f"Error during Gemini call for graph MODIFICATION/REPLACEMENT: {e}")
        return create_mock_tech_stack(user_request) # Or return existing_graph_json?

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
    """Endpoint to generate or modify a tech stack graph.
       If 'existingGraph' is provided, modifies it based on 'prompt'.
       Otherwise, generates a new graph from scratch based on 'prompt'.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    data = request.get_json()
    prompt = data.get('prompt') # Renamed 'description' to 'prompt' for consistency
    existing_graph = data.get('existingGraph') # Check for existing graph data

    if not prompt:
        return jsonify({"error": "Missing 'prompt' in request body"}), 400

    if not gemini_model:
         return jsonify({"error": "Gemini API not configured on server."}), 503

    try:
        generated_data = None
        if existing_graph and isinstance(existing_graph.get('nodes'), list) and len(existing_graph['nodes']) > 0:
            # If existing graph is valid and not empty, try modifying it
            print("Calling modify_or_replace_graph...")
            generated_data = modify_or_replace_graph(existing_graph, prompt)
        else:
            # Otherwise, generate from scratch
            print("Calling generate_graph_from_scratch...")
            generated_data = generate_graph_from_scratch(prompt)
        
        # Check if mock data was returned 
        is_mocked = generated_data.pop('mocked', False) 
        if is_mocked:
            print("Returning mocked graph data due to generation/modification failure.")
            # generated_data['is_mocked'] = True # Optionally add flag back
            
        return jsonify(generated_data), 200
        
    except Exception as e:
        print(f"Unexpected error in /api/generate-graph: {e}")
        traceback.print_exc() # Log the full stack trace
        return jsonify({"error": "An internal server error occurred during graph generation."}), 500

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

# --- Add the new endpoint --- 
@app.route('/api/generate-builder-prompt', methods=['POST'])
def api_generate_builder_prompt():
    """Endpoint to generate the detailed Markdown prompt for an LLM builder agent."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    graph_data = data.get('graphData')
    user_context = data.get('userContext', "") # Default to empty string if missing

    if not graph_data:
        return jsonify({"error": "Missing 'graphData' in request body"}), 400
    # Validate graph_data structure (basic check)
    if not isinstance(graph_data.get('nodes'), list) or not isinstance(graph_data.get('edges'), list):
         return jsonify({"error": "Invalid 'graphData' structure: 'nodes' and 'edges' must be lists."}), 400

    try:
        # --- Use the imported builder function --- 
        markdown_prompt = generate_llm_builder_prompt(graph_data, user_context)
        # ---------------------------------------

        # Check if the generator itself returned an error string
        if markdown_prompt.startswith("# Error:"):
            print(f"LLM Builder prompt generation failed: {markdown_prompt}")
            # Return a specific error code, e.g., 400 for bad input data
            return jsonify({"error": markdown_prompt}), 400 # Or 500 if it's an internal generator issue

        # Return the generated prompt successfully
        return jsonify({"markdownPrompt": markdown_prompt}), 200
    except Exception as e:
        print(f"Unexpected error in /api/generate-builder-prompt: {e}")
        traceback.print_exc() # Log the full stack trace
        return jsonify({"error": "An internal server error occurred while generating the builder prompt."}), 500
# --- End of new endpoint ---

# --- Add the new endpoint for repo script generation --- 
@app.route('/api/generate-repo-script', methods=['POST'])
def api_generate_repo_script():
    """Endpoint to generate a Bash script for creating repo structure."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    graph_data = data.get('graphData')
    user_context = data.get('userContext', "") # Default to empty string if missing

    if not graph_data:
        return jsonify({"error": "Missing 'graphData' in request body"}), 400
    # Basic validation
    if not isinstance(graph_data.get('nodes'), list):
        return jsonify({"error": "Invalid 'graphData' structure: 'nodes' must be a list."}), 400

    # Ensure the Gemini model is available
    if not gemini_model:
        return jsonify({"error": "Gemini API model not configured on server."}), 503

    try:
        # --- Call the imported repo builder function --- 
        bash_script = generate_repo_builder_script_with_gemini(
            graph_data,
            user_context,
            gemini_model # Pass the initialized model
        )
        # --------------------------------------------

        # Check if the generator returned an error string
        if bash_script.startswith("# Error:") or bash_script.startswith("# Warning:"):
            print(f"Repo script generation failed or has warnings: {bash_script}")
            # Return a specific error code, e.g., 400 or 500 depending on error type
            return jsonify({"error": bash_script}), 500 # Internal server error seems appropriate

        # Return the generated script successfully
        # We send it as plain text, but jsonify works for simple strings too
        # For clarity, we could use Flask's Response object for text/plain
        # from flask import Response
        # return Response(bash_script, mimetype='text/plain')
        return jsonify({"bashScript": bash_script}), 200 # Keep it JSON for consistency

    except Exception as e:
        print(f"Unexpected error in /api/generate-repo-script: {e}")
        traceback.print_exc() # Log the full stack trace
        return jsonify({"error": "An internal server error occurred while generating the repository script."}), 500
# --- End of repo script endpoint ---

@app.route('/')
def health_check():
    """Basic health check endpoint."""
    return jsonify({"status": "ok", "message": "Flask backend is running."})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
