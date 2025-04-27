import json # Added for potential future use or testing within this file

def generate_llm_builder_prompt(graph_data, user_context):
    """
    Generates a detailed Markdown prompt formatted for an LLM builder agent,
    based on tech stack graph data and user context.
    """
    if not graph_data or 'nodes' not in graph_data or 'edges' not in graph_data:
        return "# Error: Invalid graph data provided for prompt generation."

    nodes = graph_data.get('nodes', [])
    edges = graph_data.get('edges', [])

    # --- Extract Node Info (Label and Details) ---
    stack_list_items = []
    node_labels = {} # Store labels for edge generation
    for node in nodes:
        node_id = node.get('id')
        node_data = node.get('data', {})
        label = node_data.get('label', node_id if node_id else 'Unknown Component')
        details = node_data.get('details', 'No details provided')
        stack_list_items.append(f"- {label}: {details}")
        if node_id:
            node_labels[node_id] = label # Store label for edge mapping
    stack_list = '\n'.join(stack_list_items) if stack_list_items else "- No specific components defined."

    # --- Extract Edge Info (Source Label -> Target Label) ---
    edge_list_items = []
    for edge in edges:
        source_id = edge.get('source')
        target_id = edge.get('target')
        if source_id and target_id:
            source_label = node_labels.get(source_id, source_id) # Fallback to ID
            target_label = node_labels.get(target_id, target_id) # Fallback to ID
            edge_list_items.append(f"- {source_label} ➡️ {target_label}")
    edge_list = '\n'.join(edge_list_items) if edge_list_items else "- No specific relationships defined."

    # --- Sanitize User Context ---
    processed_context = str(user_context) if user_context else "No specific user requirements provided."
    if '\n' in processed_context or '- ' in processed_context or '* ' in processed_context:
         processed_context = '\n'.join([f"- {line.strip()}" for line in processed_context.splitlines() if line.strip()])
    elif processed_context: # Ensure non-empty context is prefixed
         processed_context = f"- {processed_context}"


    # --- Placeholder for File Structure ---
    # TODO: Implement dynamic file structure generation based on node types/labels
    file_structure_example = """
(This is a placeholder. Actual structure should be generated based on the stack.)
"""

    # --- Assemble the Markdown Prompt using the User's Template ---
    markdown = f"""
# 🛠 Tech Stack Builder Instructions

You are a powerful, agentic AI developer working inside an IDE environment capable of file system operations and code generation.

You are tasked with setting up a complete project based on the following tech stack, architecture, file structure guidelines, and user goals. Your output should be primarily the necessary code and file structure modifications.

## 📦 Project Tech Stack

The core components for this project are:
{stack_list}

## 🔗 Architecture Overview

The components should interact as follows:
{edge_list}

## 🛠 File Structure Overview

Generate a project structure that logically organizes the components listed above. Follow common conventions for the specified technologies. A suggested starting point is:
{file_structure_example}
Refine this structure based on the specific components and their relationships.

## 🧠 User Requirements and Goals

The primary goals and features requested by the user are:
{processed_context}

## 🎯 Mission for AI

Execute the following steps to build the project:

1.  **Create Project Structure:** Establish the main directories and subdirectories based on the tech stack and best practices (referencing the File Structure Overview).
2.  **Generate Starter Files:** Create essential configuration files (`package.json`, `requirements.txt`, `.env.example`, `Dockerfile`, etc.) and basic entry point files (`app.py`, `main.js`, `index.html`, etc.) for each service/component.
3.  **Implement Boilerplate Code:** Add initial, functional code for basic setup (e.g., server initialization, database connection setup, simple API endpoint, basic frontend component).
4.  **Establish Connections:** Implement basic communication patterns based on the Architecture Overview (e.g., a sample API call from the frontend to the backend, backend query to the database).
5.  **Add Documentation:** Generate a `README.md` file outlining the project structure, setup instructions (dependencies, environment variables), and how to run each component. Include a `.gitignore` file.

**Critical Instructions:**
- Prioritize generating runnable, clean, and modular code.
- Assume the target environment has necessary tools (Node.js, Python, Docker, etc.) installed.
- Use the details provided in the "Project Tech Stack" section (e.g., specific versions, libraries) when generating configurations and code.
- If specific details are missing, make reasonable assumptions based on modern best practices for the given technologies.
- Minimize explanatory text in your response; focus on the code and file structure output. Output explanations only if critical for understanding a complex decision.
- Ensure authentication/authorization flows are considered if mentioned in the requirements.
    """.strip()

    return markdown

# --- Example Usage (for testing this file directly) ---
# THIS BLOCK IS ESSENTIAL FOR SEEING OUTPUT WHEN RUNNING THE SCRIPT
if __name__ == '__main__':
    # Define the mock data directly inside this block
    mock_graph_data = {
      "nodes": [
        {"id": "frontend", "type": "techNode", "data": {"label": "Next.js Frontend", "details": "Next.js 14, React 18, Tailwind CSS"}},
        {"id": "backend", "type": "techNode", "data": {"label": "FastAPI Backend", "details": "Python 3.11, FastAPI, SQLAlchemy"}},
        {"id": "auth", "type": "techNode", "data": {"label": "Auth0 Service", "details": "OAuth 2.0, JWT for API"}},
        {"id": "db", "type": "techNode", "data": {"label": "PostgreSQL DB", "details": "PostgreSQL 15, hosted on Neon"}}
      ],
      "edges": [
        {"source": "frontend", "target": "backend"},
        {"source": "backend", "target": "db"},
        {"source": "frontend", "target": "auth"},
        {"source": "backend", "target": "auth"} # Backend might also verify tokens
      ]
    }
    mock_user_context = """
    Implement login/logout using Auth0.
    User profile page should display user email.
    Create an admin dashboard accessible only to 'admin' role.
    API needs endpoints for /users and /items.
    """

    # Call the function with the mock data
    generated_prompt = generate_llm_builder_prompt(mock_graph_data, mock_user_context)

    # Print the header and the generated prompt
    print("--- Generated LLM Builder Markdown Prompt ---")
    print(generated_prompt)
    print("\n-------------------------------------------") 