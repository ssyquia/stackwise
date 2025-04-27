# stackwise

## Project info

**URL**: https://stackwise-omega.vercel.app/

## Inspiration
We noticed that designing tech stacks for projects can often be overwhelming — whether you're a junior developer unsure where to start, or a senior engineer trying to optimize for production. We wanted to create a tool that would make this process faster, smarter, and more intuitive by combining natural language, graph-based architecture, and AI.

## What it does
Stackwise lets users generate full tech stacks just by describing their project in plain English. It creates a graph visualization of the recommended stack, lets users manually edit technologies and connections, and even generates project scaffolds to kickstart development — all powered by an intelligence layer built on Google Gemini.

## How we built it
We built a frontend web app where users can chat, generate, and edit their tech stacks visually. Under the hood, we used Google Gemini to process natural language prompts, understand technology relationships, and adjust recommendations on the fly. We also created a system to generate bash scripts that scaffold repositories based on the custom tech stack graph. Our backend manages chat history, graph structure, and AI interactions to personalize every user's experience.

## Challenges we ran into
- Designing a UI that felt intuitive for beginners while still being precise enough for advanced users.
- Structuring the graph storage system so that Gemini could interpret and modify relationships between technologies accurately.
- Building a smooth workflow from prompt to editable graph to repo scaffold.
- Integrating AI in a way that felt natural and reliable, not just a gimmick.
- Deploying the frontend to Vercel and the backend to Railway.

## Accomplishments that we're proud of
- Building an end-to-end system where users can go from an idea to a deployable project structure in just a few minutes.
- Successfully combining AI, graph editing, and scaffold generation into a seamless developer experience.
- Creating a tool that feels useful not just at a hackathon, but also for real-world production planning.

## What we learned
- How to effectively integrate AI into developer workflows without making it feel forced.
- How to design flexible data structures that can bridge natural language input and complex technical outputs.
- How to optimize the user experience for both newcomers and experienced engineers.

## What's next for stackwise
- Allowing export to real GitHub repositories directly from the app.
- Adding cost, speed, and reliability optimization toggles based on user goals.
- Integrating more AI suggestions like security best practices or deployment recommendations.
- Scaling Stackwise into a full developer platform for end-to-end project architecture and deployment.

## Built with
- Next.js
- React Flow
- TypeScript
- Flask API
- Google Gemini API
- Flask (Python backend)
- Railway (backend hosting)
- Vercel (frontend hosting)
