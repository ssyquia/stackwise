import os
import shlex # Used for quoting paths safely in bash
import json
import textwrap
# --- Add Gemini imports ---
import google.generativeai as genai 
# --------------------------

def generate_repo_builder_script_with_gemini(graph_data, user_context, gemini_model):
    """
    Generates a Bash script string using the Gemini API to create a 
    basic project directory structure and placeholder files based on 
    tech stack graph data and user context.

    Args:
        graph_data (dict): A dictionary representing the tech stack, 
                           expected to have 'nodes' and 'edges' keys.
        user_context (str): Additional context or requirements from the user.
        gemini_model (genai.GenerativeModel): Initialized Gemini model instance.

    Returns:
        str: A multi-line string containing the Bash script, or an error message 
             prefixed with '# Error:'.
    """
    # --- Check for Gemini Model ---
    if not gemini_model:
        print("Error: Gemini model instance not provided to generate_repo_builder_script_with_gemini.")
        return "# Error: Gemini model not available."
    # ----------------------------
    
    if not graph_data or 'nodes' not in graph_data:
        return "# Error: Invalid graph data provided for script generation."

    try:
        # --- Prepare data for the prompt ---
        graph_str = json.dumps(graph_data, indent=2)
    except TypeError:
        graph_str = str(graph_data) # Fallback if graph is not JSON serializable
        print("Warning: Could not serialize graph data to JSON for Gemini prompt.")

    # --- Construct the Prompt for Gemini ---
    prompt = textwrap.dedent(f"""
    You are an expert system administrator and software developer tasked with generating a Bash script.
    This script will scaffold a basic project structure on the user's local machine based on a provided tech stack graph and user requirements.

    **Input Tech Stack (React Flow JSON format):**
    ```json
    {graph_str}
    ```

    **User Requirements/Context:**
    "{user_context if user_context else 'No specific user requirements provided.'}"

    **Your Task:**
    Generate ONLY a valid Bash script (`#!/bin/bash`) that performs the following actions:
    1.  Creates the necessary directory structure based on the components in the tech stack graph (e.g., `frontend/`, `backend/`, `frontend/src/`, `services/api_name/`). Use logical names derived from the node labels/types (e.g., 'React Frontend' node might lead to a `frontend/` directory).
    2.  Creates essential placeholder files within those directories using the `touch` command (e.g., `frontend/package.json`, `backend/app.py`, `README.md`, `.gitignore`, `.env.example`). Determine appropriate files based on node labels/types (e.g., a 'python' backend needs `requirements.txt` and `app.py`, a 'react' frontend needs `package.json`, `src/index.js`, `public/index.html`).
    3.  Uses `mkdir -p` to create directories recursively and avoid errors if they already exist.
    4.  Uses **proper quoting** for ALL file and directory paths in the `mkdir` and `touch` commands to handle spaces or special characters safely. Use single quotes (e.g., `mkdir -p 'my frontend dir'` or `touch 'my backend dir/app.py'`). **This is critical.**
    5.  Add basic, common content to `.gitignore` (e.g., node_modules, venv, .env*, !.env.example, __pycache__).
    6.  Add a basic `README.md` structure including the User Requirements and a placeholder for setup instructions. Use `cat << EOF` for multi-line content.
    7.  Include `set -e` at the beginning of the script to ensure it exits on error.
    8.  Include a final `echo` message indicating success (e.g., "Project structure created successfully!").

    **Output Format:**
    Return ONLY the raw Bash script content, starting precisely with `#!/bin/bash` and ending with the final `echo` command. Do NOT include any explanations, introductions, markdown code fences (```bash ... ```), or any other text outside the script itself.

    **Example of Correctly Quoted Output Snippet:**
    ```bash
    #!/bin/bash
    set -e

    # Create directories
    mkdir -p 'frontend'
    mkdir -p 'backend service' # Example with space
    mkdir -p 'frontend/src'

    # Create placeholder files
    touch 'frontend/package.json'
    touch 'backend service/main.py' # Example with space
    touch 'README.md'
    touch '.gitignore'

    # Add basic content
    cat << EOF > '.gitignore'
node_modules/
venv/
.env*
!.env.example
__pycache__/
EOF

    cat << EOF > 'README.md'
# Project Title (Generated)

User Requirements: {user_context if user_context else 'N/A'}

## Setup
(Add setup instructions here)
EOF

    echo 'Project structure created successfully!'
    ```
    """)
    # --- End Prompt ---

    try:
        print(f"Sending prompt to Gemini for Bash script generation (Context: {user_context[:50]}...)")
        # --- Call Gemini API ---
        response = gemini_model.generate_content(prompt)
        # ----------------------

        # --- Process Gemini Response ---
        if not response.parts:
            feedback = response.prompt_feedback
            error_msg = f"# Error: Gemini response was blocked or empty for bash script generation.\n# Feedback: {feedback}"
            print(f"Warning: {error_msg}")
            return error_msg

        bash_script = response.text.strip() # Remove leading/trailing whitespace

        # Basic validation: Check if it starts with #!/bin/bash
        if not bash_script.startswith("#!/bin/bash"):
             # Sometimes the model might add ```bash prefix, try removing it
             if bash_script.startswith("```bash"):
                 bash_script = bash_script[len("```bash"):].strip()
                 if bash_script.endswith("```"):
                      bash_script = bash_script[:-len("```")].strip()
                 
             # Re-check after potential cleaning
             if not bash_script.startswith("#!/bin/bash"):
                 warning_msg = "# Warning: Gemini output did not start with #!/bin/bash. Returning raw output, review before execution."
                 print(warning_msg)
                 # Return the raw output anyway, maybe it's just missing the shebang or has extra text
                 return f"{warning_msg}\n{bash_script}"
        # ---------------------------

        print("Received Bash script from Gemini.")
        return bash_script # Return the cleaned script

    except Exception as e:
        error_msg = f"# Error generating Bash script via Gemini: {e}"
        print(f"Error during Gemini call for Bash script generation: {e}")
        return error_msg
    # --- End Gemini Logic ---


# --- Example Usage (Requires configured Gemini model) ---
if __name__ == '__main__':
    # NOTE: This example section is primarily for demonstrating the call structure.
    # It requires a valid, configured 'gemini_model' object to run successfully.
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