import os
import shlex # Used for quoting paths safely in bash
import json
import textwrap
# --- Add Gemini imports ---
import google.generativeai as genai 
# --------------------------

def generate_repo_builder_script_with_gemini(graph_data, user_context, model):
    """
    Generates a Bash script string using the Gemini API to create a 
    basic project directory structure and placeholder files based on 
    tech stack graph data and user context.

    Args:
        graph_data (dict): A dictionary representing the tech stack, 
                           expected to have 'nodes' and 'edges' keys.
        user_context (str): Additional context or requirements from the user.
        model (genai.GenerativeModel): Initialized Gemini model instance.

    Returns:
        str: A multi-line string containing the Bash script, or an error message 
             prefixed with '# Error:'.
    """
    if not model:
        return "# Error: Gemini model not provided to repository builder."

    # Prepare graph data representation for the prompt
    try:
        # Simple representation: List node labels and types
        nodes_info = []
        for node in graph_data.get('nodes', []):
            label = node.get('data', {}).get('label', 'Unknown Node')
            node_type = node.get('data', {}).get('type', 'custom')
            nodes_info.append(f"- {label} ({node_type})")
        
        # If no nodes, return a basic script
        if not nodes_info:
             return "#!/bin/bash\n# Warning: No nodes found in graph data.\nmkdir project_root\ncd project_root\necho '# Project Readme' > README.md\necho 'Initial structure created.'\n"

        nodes_str = "\\n".join(nodes_info)

    except Exception as e:
        print(f"Error processing graph data for repo script prompt: {e}")
        return f"# Error: Could not process graph data for script generation. Details: {e}"

    # --- Enhanced Prompt for Bash Script Generation ---
    prompt = textwrap.dedent(f"""
    You are an expert system administrator creating a Bash script to initialize a project directory structure.
    The project is based on the following components derived from a tech stack diagram:
    {nodes_str}

    The user provided this additional context: "{user_context}"

    Generate ONLY a valid Bash script (`#!/bin/bash` shebang required) that performs the following actions:
    1. Creates a root directory named `project_root`.
    2. Changes into the `project_root` directory.
    3. Creates a sensible directory structure based *only* on the listed components and common conventions for such technologies.
        - **Crucially:** Use `mkdir -p` to create nested directories if needed (e.g., `mkdir -p src/components`, `mkdir -p backend/routes`). Ensure all parent directories exist.
        - Consider standard folder names (e.g., `src`, `app`, `components`, `utils`, `config`, `tests`, `server`, `client`, `db`, `scripts`, `docs`).
        - Group related components logically (e.g., put React components under `src/components`, Flask routes under `backend/routes`).
    4. Creates placeholder files within the relevant directories (e.g., `README.md`, `.gitignore`, `requirements.txt`, `package.json`, `main.py`, `App.js`, `index.html`).
        - Use `echo` or `touch` to create empty or minimal placeholder files. For example: `echo '# Project Title' > README.md` or `touch src/index.js`.
    5. Add comments in the script explaining major sections (e.g., `# Create frontend structure`).
    6. Conclude the script with an `echo` statement indicating completion, like `echo "Project structure created successfully."`.

    **Constraints:**
    - The script must be runnable on a standard Linux/macOS environment.
    - Do NOT include any commands outside the scope of creating directories and placeholder files (no `git init`, `npm install`, `pip install`, etc.).
    - Output ONLY the raw Bash script code, starting with `#!/bin/bash` and nothing else before or after it.
    - Do not wrap the script in markdown code blocks.
    """)
    # --- End of Prompt ---

    try:
        print("Sending prompt to Gemini for repository script generation...")
        response = model.generate_content(prompt)

        # Handle potential safety blocks or empty responses
        if not response.parts:
            feedback = response.prompt_feedback
            print(f"Warning: Gemini repo script response blocked or empty. Feedback: {feedback}")
            return f"# Warning: AI response was blocked or empty. Feedback: {feedback}\n\n#!/bin/bash\nmkdir project_root\ncd project_root\necho '# Fallback Readme' > README.md\necho 'Warning: Script generation failed, created basic structure.'\n"

        script_text = response.text
        
        # Basic validation: Check for shebang and remove potential markdown backticks
        script_text = script_text.strip()
        if script_text.startswith("```bash"):
            script_text = script_text[7:]
        if script_text.startswith("```"):
             script_text = script_text[3:]
        if script_text.endswith("```"):
            script_text = script_text[:-3]
        
        script_text = script_text.strip() # Clean again after removing backticks

        if not script_text.startswith("#!/bin/bash"):
            print("Warning: Generated script missing shebang. Adding it.")
            # Try to salvage if possible, otherwise return error
            if len(script_text) > 10: # Arbitrary check for some content
                 script_text = "#!/bin/bash\\n\\n" + script_text
            else:
                return "# Error: Generated script content is invalid or too short.\n"

        print("Received valid-looking Bash script from Gemini.")
        return script_text

    except Exception as e:
        print(f"Error during Gemini call for repo script generation: {e}")
        return f"# Error: An exception occurred during script generation: {e}"


# --- Example Usage (Requires configured Gemini model) ---
if __name__ == '__main__':
    # NOTE: This example section is primarily for demonstrating the call structure.
    # It requires a valid, configured 'model' object to run successfully.
    # You'll typically test this by calling the corresponding API endpoint in app.py.
    
    print("--- Running Example Usage (Requires Configured Gemini Model) ---")

    # Example graph data (replace with actual data if testing live)
    example_graph = {
        "nodes": [
            {
                "id": "node_react", "type": "techNode", "position": {"x": 100, "y": 100},
                "data": {"label": "React Frontend", "type": "frontend", "details": "Vite, Tailwind CSS"}
            },
            {
                "id": "node_flask_api", "type": "techNode", "position": {"x": 100, "y": 300},
                "data": {"label": "Flask REST API", "type": "backend", "details": "Python 3.11, SQLAlchemy"}
            },
             {
                "id": "node_postgres", "type": "techNode", "position": {"x": 400, "y": 300},
                "data": {"label": "PostgreSQL DB", "type": "database", "details": "Stores user data"}
            }
        ],
        "edges": [
             {"id": "e1", "source": "node_react", "target": "node_flask_api"},
             {"id": "e2", "source": "node_flask_api", "target": "node_postgres"}
        ]
    }
    
    user_context_example = "Build a web app to track personal book reading progress."

    # --- !!! IMPORTANT: Replace 'None' with your actual initialized Gemini model !!! ---
    # In a real scenario, this model would likely be initialized in your main app
    # and passed down. For standalone testing, you'd need to set up the API key here.
    
    # Placeholder setup (replace with your actual API key loading and model init)
    try:
        # Attempt to load API key similar to app.py for standalone testing
        from dotenv import load_dotenv
        script_dir = os.path.dirname(__file__)
        dotenv_path = os.path.join(script_dir, '.env')
        load_dotenv(dotenv_path=dotenv_path, override=True)
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            test_model = genai.GenerativeModel('gemini-1.5-flash-latest') 
            print("Gemini model initialized for testing.")
        else:
            test_model = None
            print("GEMINI_API_KEY not found in .env, cannot initialize model for testing.")
    except Exception as setup_e:
        test_model = None
        print(f"Error initializing Gemini model for testing: {setup_e}")
    # --- End Placeholder Setup ---


    if test_model:
        # Generate the script using the actual or test model
        bash_script = generate_repo_builder_script_with_gemini(
            example_graph, 
            user_context_example, 
            test_model # Use the initialized model
        )

        # Print the generated script
        print("\n--- Generated Bash Script ---")
        print(bash_script)
        print("-----------------------------")

        # Example: Save the script to a file
        # try:
        #     with open("generated_setup_project.sh", "w") as f:
        #        f.write(bash_script)
        #     print("\nScript saved to generated_setup_project.sh")
        #     # Make executable (optional, depends on OS/permissions)
        #     # import stat
        #     # os.chmod("generated_setup_project.sh", stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH) 
        #     # print("Made script executable (chmod +x)")
        # except IOError as e:
        #     print(f"\nError saving script to file: {e}")
            
    else:
         print("\nSkipping script generation example as Gemini model could not be initialized.")

    print("\n--- Example Usage End ---")