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
        print(f"--- DEBUG: Explicitly loading .env from: {dotenv_path} with override=True ---")
        loaded = load_dotenv(dotenv_path=dotenv_path, override=True)
        if not loaded:
            print(f"--- WARNING: load_dotenv did not find file at: {dotenv_path} ---")
        # --------------------------------------------------------

        # Retrieve the key AFTER the explicit load_dotenv call
        api_key = os.getenv("GEMINI_API_KEY") 
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables (check .env and ensure it was loaded)." ) 
            
        genai.configure(api_key=api_key)

        # Initialize the model exactly as in detail-generator.py
        model_name = 'gemini-2.5-flash-preview-04-17' # Using this model name
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

# --- Helper: Generate Graph from Description ---
def generate_tech_stack_graph(description):
    """Uses Gemini to generate a tech stack graph JSON based on description.
    
    Note: Internally uses a prompt asking for numerical IDs and specific fields,
    then converts the response to the React Flow format expected by the frontend.
    """
    if not gemini_model:
        # Use mock if model failed to initialize
        print("Gemini model not initialized, using mock fallback.")
        # Mock function should return React Flow format directly
        return create_mock_tech_stack(description)

    # --- NEW PROMPT --- (Adapted from json-generator.py)
    prompt = textwrap.dedent(f"""
    You are a senior software architect helping to design a tech stack diagram. 
    Based on the following project description, generate a comprehensive tech stack with appropriate components.
    
    Project description: {{description}}
    
    Return a JSON object with this exact structure:
    {{
      "nodes": [
        {{
          "id": 1,  // Use unique sequential numbers as IDs (1, 2, 3, etc.)
          "name": "Component Name",
          "details": "YOUR_API_KEY=xxxx,PASSWORD=xxxx,ENV_VAR=value",  // ONLY user parameters like API keys and passwords
          "xpos": 100,
          "ypos": 200
        }}
        // ... more nodes
      ],
      "edges": [
        {{
          "sourceID": 1,  // Must be a number matching a node id
          "targetID": 2   // Must be a number matching a node id
        }}
        // ... more edges
      ]
    }}
    
    The nodes should include:
    1. Frontend frameworks/libraries
    2. Backend languages/frameworks
    3. Database systems
    4. APIs and third-party services
    5. Deployment/hosting platforms
    
    IMPORTANT: The "details" field should ONLY include user-based parameters such as:
    - API keys (use placeholders like YOUR_API_KEY_HERE)
    - Passwords (use placeholders)
    - Environment variables
    - Connection strings
    - Configuration parameters
    
    Do NOT include any descriptive text about the technology itself in the details field.
    Position the nodes logically with xpos and ypos coordinates.
    Make edges between nodes that are related (e.g., frontend calls backend API).
    
    Return ONLY valid JSON without any explanation or additional text.
    """)
    # --- END NEW PROMPT ---

    try:
        print("Sending new prompt format to Gemini for graph generation...")
        response = gemini_model.generate_content(prompt)

        # Handle potential safety blocks or empty responses
        if not response.parts:
            feedback = response.prompt_feedback
            print(f"Warning: Gemini response blocked or empty. Feedback: {feedback}")
            error_message = "Failed to generate graph: Response was blocked or empty."
            if hasattr(feedback, 'block_reason') and feedback.block_reason:
                error_message += f" Reason: {feedback.block_reason.name}"
            # USE MOCK as fallback if response is blocked/empty
            print("Gemini response blocked/empty, using mock fallback.")
            return create_mock_tech_stack(description)

        response_text = response.text
        print("Received response text from Gemini (new format expected).")

        # Attempt to extract JSON cleanly
        raw_tech_stack = None
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end != 0:
                json_str = response_text[json_start:json_end]
                raw_tech_stack = json.loads(json_str)
            else:
                 raise ValueError("No JSON object structure found in response.")
        except (json.JSONDecodeError, ValueError) as json_e:
            print(f"JSON Decode Error (raw format): {json_e}")
            print(f"Response Text causing error:\n---\n{response_text}\n---")
            print(f"Invalid JSON from Gemini ({json_e}), using mock fallback.")
            return create_mock_tech_stack(description)

        # Basic validation of the *raw* parsed structure
        if not isinstance(raw_tech_stack.get('nodes'), list) or not isinstance(raw_tech_stack.get('edges'), list):
             print("Generated raw JSON has incorrect structure, using mock fallback.")
             return create_mock_tech_stack(description)

        # --- CONVERSION TO REACT FLOW FORMAT --- 
        print("Converting raw Gemini response to React Flow format...")
        react_flow_nodes = []
        node_id_map = {} # Map numerical ID to string ID

        for node in raw_tech_stack.get('nodes', []):
            num_id = node.get('id')
            name = node.get('name', 'Unnamed Node')
            details = node.get('details', '')
            xpos = node.get('xpos', 100) # Default position
            ypos = node.get('ypos', 100)
            
            if num_id is None:
                print(f"Warning: Skipping node with missing 'id': {node}")
                continue
                
            # Determine category type based on name heuristics (simple example)
            node_type_category = "custom" 
            name_lower = name.lower()
            if any(kw in name_lower for kw in ["react", "vue", "angular", "svelte", "frontend"]):
                node_type_category = "frontend"
            elif any(kw in name_lower for kw in ["node", "flask", "django", "spring", "backend", "api"]):
                node_type_category = "backend"
            elif any(kw in name_lower for kw in ["mongo", "postgres", "mysql", "sql", "database", "redis"]):
                node_type_category = "database"
            elif any(kw in name_lower for kw in ["aws", "azure", "gcp", "docker", "kubernetes", "deploy"]):
                 node_type_category = "deployment"

            str_id = f"node_{num_id}"
            node_id_map[num_id] = str_id
            
            react_flow_nodes.append({
                "id": str_id,
                "type": "techNode",
                "position": {"x": xpos, "y": ypos},
                "data": {
                    "label": name,
                    "type": node_type_category, # Infer type for coloring/icons
                    "details": details
                }
            })
        
        react_flow_edges = []
        edge_counter = 1
        for edge in raw_tech_stack.get('edges', []):
            source_num_id = edge.get('sourceID')
            target_num_id = edge.get('targetID')

            if source_num_id is None or target_num_id is None:
                print(f"Warning: Skipping edge with missing source/target ID: {edge}")
                continue
                
            source_str_id = node_id_map.get(source_num_id)
            target_str_id = node_id_map.get(target_num_id)

            if not source_str_id or not target_str_id:
                print(f"Warning: Skipping edge referencing unknown node ID: {edge}")
                continue
                
            react_flow_edges.append({
                "id": f"edge_{source_str_id}_to_{target_str_id}_{edge_counter}",
                "source": source_str_id,
                "target": target_str_id,
                "type": "default",
                "markerEnd": {"type": "arrowclosed"}
            })
            edge_counter += 1
            
        converted_tech_stack = {
            "nodes": react_flow_nodes,
            "edges": react_flow_edges
        }
        # --- END CONVERSION --- 

        print(f"Successfully generated and converted graph data for: {description[:50]}...")
        return converted_tech_stack # Return the converted data
        
    except Exception as e:
        # Catch-all for other Gemini/network/conversion errors
        print(f"Error during Gemini call or processing/conversion: {e}, using mock fallback.")
        return create_mock_tech_stack(description) # Use mock for other errors

# --- Helper: Get Connected Nodes --- (Adapted from fetch-coordinator.py)
def get_connected_nodes(diagram_data, node_id):
    """Find node data for all nodes connected to the specified node ID."""
    if not isinstance(diagram_data, dict) or not isinstance(diagram_data.get('nodes'), list) or not isinstance(diagram_data.get('edges'), list):
        print("Warning: Invalid diagram_data structure passed to get_connected_nodes")
        return []

    connected_node_ids = set()
    node_map = {node.get('id'): node for node in diagram_data.get('nodes', [])} # Map ID to node data

    for edge in diagram_data.get('edges', []):
        source_id = edge.get('source')
        target_id = edge.get('target')

        if source_id == node_id and target_id:
            connected_node_ids.add(target_id)
        elif target_id == node_id and source_id:
            connected_node_ids.add(source_id)

    # Get the actual node data for the connected IDs
    connected_nodes = [node_map[c_id] for c_id in connected_node_ids if c_id in node_map]
    return connected_nodes

# --- Helper: Generate Node Details --- (Adapted from fetch-coordinator.py)
def generate_node_details(node_name, current_details, context):
    """Uses Gemini to generate detailed information about a technology node."""
    if not gemini_model:
        raise ConnectionError("Gemini model not initialized.")

    # Prompt adapted from fetch-coordinator.py
    prompt = textwrap.dedent(f"""
    You are an expert providing detailed information about a specific technology used in a software architecture.

    Technology Name: "{node_name}"

    Context within the project:
    {context}

    Current user-provided details (if any): {current_details if current_details else "None"}

    Please provide comprehensive details about "{node_name}" relevant to a developer or architect, including:
    1. Core Purpose & Key Features: What is its main function? What are its standout capabilities?
    2. Use Cases: When is it typically used in a tech stack like this?
    3. Integration Notes: How does it commonly interact with the connected components mentioned in the context? Any specific considerations?
    4. Configuration Hints: What are common configuration parameters or environment variables needed (use generic examples like DB_HOST, API_ENDPOINT, PORT)?
    5. Alternatives: Briefly mention 1-2 common alternatives and why one might choose them instead.
    6. Pricing Model (General): Is it typically open-source, free tier, usage-based, subscription, etc.? (No specific numbers needed).

    Format the output as clear, concise text suitable for a tooltip or information panel. Avoid excessively long paragraphs.
    Focus on practical information helpful for understanding its role in *this* architecture.
    """)

    try:
        print(f"Sending prompt to Gemini for details on: {node_name}")
        response = gemini_model.generate_content(prompt)

        if not response.parts:
            feedback = response.prompt_feedback
            print(f"Warning: Gemini response blocked or empty for details on {node_name}. Feedback: {feedback}")
            error_message = "Failed to generate details: Response was blocked or empty."
            if hasattr(feedback, 'block_reason') and feedback.block_reason:
                error_message += f" Reason: {feedback.block_reason.name}"
            return {"error": error_message}

        print(f"Successfully generated details for: {node_name}")
        return {"details": response.text}
    except Exception as e:
        print(f"Error generating details for {node_name} via Gemini: {e}")
        return {"error": f"Failed to generate details for {node_name}: {e}"}

# --- API Endpoints ---

@app.route('/api/generate-graph', methods=['POST'])
def api_generate_graph():
    """Endpoint to generate a tech stack graph from a text description."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    description = data.get('description')
    if not description:
        return jsonify({"error": "Missing 'description' in request body"}), 400

    if not gemini_model:
         return jsonify({"error": "Gemini API not configured on server."}), 503

    try:
        generated_data = generate_tech_stack_graph(description)
        if "error" in generated_data:
             print(f"Graph generation failed: {generated_data['error']}")
             return jsonify({"error": f"Failed to generate graph via AI: {generated_data['error']}"}), 500
        return jsonify(generated_data), 200
    except ConnectionError as e:
         return jsonify({"error": str(e)}), 503
    except Exception as e:
        print(f"Unexpected error in /api/generate-graph: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/api/fetch-details', methods=['POST'])
def api_fetch_details():
    """Endpoint to fetch detailed information about a specific node."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    node_id = data.get('node_id')
    node_name = data.get('node_name')
    current_details = data.get('current_details', '')
    diagram_data = data.get('diagram')

    if not node_id or not node_name or not diagram_data:
        return jsonify({"error": "Missing required fields: node_id, node_name, diagram"}), 400
    if not isinstance(diagram_data.get('nodes'), list) or not isinstance(diagram_data.get('edges'), list):
        return jsonify({"error": "Invalid diagram data structure"}), 400

    if not gemini_model:
         return jsonify({"error": "Gemini API not configured on server."}), 503

    try:
        # Find context: connected nodes
        connected_nodes_data = get_connected_nodes(diagram_data, node_id)
        connected_names = [n.get('data', {}).get('label', 'Unknown') for n in connected_nodes_data]
        if connected_names:
            context = f"It is connected to: {', '.join(connected_names)}."
        else:
            context = "It is currently not connected to any other components."

        print(f"Fetching details for node '{node_name}' (ID: {node_id}) with context: {context}")

        # Call the helper to generate details
        result = generate_node_details(node_name, current_details, context)

        if "error" in result:
             print(f"Details generation failed for {node_name}: {result['error']}")
             return jsonify({"error": f"Failed to generate details via AI for {node_name}."}), 500

        return jsonify(result), 200 # Returns { "details": "... text ..." }

    except ConnectionError as e:
         return jsonify({"error": str(e)}), 503
    except Exception as e:
        print(f"Unexpected error in /api/fetch-details: {e}")
        return jsonify({"error": "An internal server error occurred while fetching details."}), 500

@app.route('/')
def health_check():
    """Basic health check endpoint."""
    return jsonify({"status": "ok", "message": "Flask backend is running."})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
