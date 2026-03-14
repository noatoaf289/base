# Visualis - AI Virtualization

# Goal
Create A site that can make 1-page HTML snippets as IFRAME in my system. 
I have a dashboard system where i have data from external sources and all sorts of visualizations. those visualizations include tables, graphs, maps, connection graphs, metrics, iframes and etc.

The site will be used in a closed network - that means that you are limited to which libraries to use.

# About the site
This site is going to get information from users - prompt what to build, injected information, and then run it with an openai completions api compatible opensource model which then will generate the html (one page containing html, css, javascript) snippet to inject. afterwards, we will add to the injected html the needed libraries out of a strict list (only the files in libs list).

# About my ecosystem
I have an ecosystem of DAG runners where each DAG is called a package. Each package has a packageId a package contains many Cubes - each cube is a DAG Node. each node returns a list of objects in a specific way. i have a dashboarding system containing blocks where you can use my graph builders and map components and build them like blocks and thus build dashboards. each block (graph, map, table) is using a data from a specific cube in my package - any of them. several blocks can display different things and use the same cube.

one of the blocks i have is html block where you can put your custom code inside. your job is to make a system (site ui + backend + langchain agentic loop ) that generates the html, displays it, makes a feedback loop with the user and then sends it to flapi. 


# Site Flow
1. User opens site
2. User enters package id and run parameters - run parameters is the json body to send the request to flapi. I imagine there should be a monaco json editor there that allows the user to enter parameters with syntax highlighting. the package id is an autocomplete field that makes a GET request to flapi /package/v1/search/<partial-package-id>. this route returns an array of objects where each object has "Id" number field, string "Logo" field which is a base64 representation of a logo and string "Name" field which represents the package name. there is also a string field called "Type", make sure you filter for only type of "Package" in that field.  
3. You make the request to flapi to /package/<package-id> in POST method with the run-parameters. This will return an object with lots of fields, the interesting one among them is "results" which is a dictionary where the key is the cube name and the value is an array of the results of that same cube. Each result is an object with different keys dependending on the cube. Save this run for later use. (I will refer it as 'package-run-results') 
4. Extract cube names from 'package-run-results' and make an auto complete so that user can select a cube. this cube will be refered as 'main-cube'
5. Extract names of fields of the main-cube's results by going through all items returned and finding all the fields. delete 'package-run-results' except the main-cube's result
6. Take the data from step 5 and crate a ui that allows the user to select some of the fields and for each selected field explain its meaning in up to 100 letters. The way i imagine it is like a big '+' button of "Add Field explanation" (or something like that), when pressed it will render an autocomplete input of field name and a text area to put the explanation. there will be a limit of 16 fields. 
7. User enters prompt in a text box (similar to base44)
8. User sees agent's reasoning and spinning circles
9. User sees codepen-like view - half iframe screen with the injected data from package-run-results and half the code itself in a monaco code editor with html css js autocompletes. There will also be 3 buttons on top: Start over which will reload the site, Copy code which will select all code (half view) and copy it to clipboard, and feedback loop which will allow users to make a continuation prompt that they can fix issues they see in the code. the user can also change some of the code himeself and add a prompt feedback loop and the model should know how to work with it. 

# services to create

## Agent
The agent itself is a langchain based agent using a vllm with completions api compatible model. Assume the model does not know how to tool call mcp servers. This is a code inside the server. 

what the agent should do:
- Receive the cube fields explanations
- Receive a system prompt with limitations
- Receive user prompt safely
- Split the User prompt into action items - up to 5 action items
- Try to find which libraries to use (if any)
- Retrieve the md file from libs explaining on the library throughly
- Create the Html Snippet and save it in s3.
- (in parallel) Create summary of all reasoning and prompts from this process and save it in redis. short summary of up to 100000 letters.
- return html snippet to server alongside which libraries were used.

i want you to split it to 3 different prompts:

- splitting to tasks using a 

in case of feedback loop:
- Receive the feedback
- Receive the summary
- Receive the Html snippet (modified or not)
- Identify if user changed anything in the code before feedback
- Split the User feedback into action items - up to 3 action items
- Create the Html Snippet and save it in s3.

## Server
The Server that does everything:
- Serves the client's files
- Proxy between client and flapi
- Proxy between client and langchain
- Exposes `POST /api/model/prompt` so injected HTML snippets can run non-streaming prompt bundles (user/system/structured-output/restrictions) through a server-managed model URL and credentials.
- source injection of libraries to html snippet.
- Serves the libs files

Once the agent creates the html, we need to inject the libraries. Since we are working in a closed network, I have the dist files of most used vanilla libraries. What you will need to do is to add to the top of the head tag the needed tags to put the libraries inside the snippet. for a js+css library it will look like this:
```html
<head>
    <script>  /* obfuscated_code_here */ </script>
    <style>  /* obfuscated_code_here*/ <style>
    <!--More Tags-->
```
for a js only library it looks something like this:
```html
<head>
    <script>  /* obfuscated_code_here */ </script>
    <!--More Tags-->
```
you need to idnetify for each dist library in dist whether it is js only, js+css or css only.

we also need a way to serve the saved html snippets as html files that an iframe can run, and we need the server to have no cors.

env variables:
- main model url + model user + model password
- secondary model url + model user + model password
- public snippet model route target: `PUBLIC_MODEL_URL`, `PUBLIC_MODEL_USER`, `PUBLIC_MODEL_PASSWORD`
- flapi url
- redis url (with user, password, host, port)
- s3 compatible url + access key + private key
- base url - your current url
- IFRAME data injection event
- Leaflet tiles url

### Library Injection Flow
the way it works - I have a bunch of browser-ready dist files of all the libraries i want to use. the way the the model's response will leave a placeholder tags (e.g. for leaflet <Library:Leaflet />) which have no visual meaning. Then, The server will str.replace those with actual working script with src and link tags (using base url and statically serving those libs files). 
Note that the tag replacement doesnt have to be one in one. Leaflet for example needs both css and js files being served, that means <Library:Leaflet /> will be replaced by both script tag with src and link tag with href of matching dist files.

This means every md file must have an installation guide of which placeholder tags it should put and where (bottom body tag or bottom head tag)

This also means the backend needs to know to find them and replace them with the proper tags. I want the backend to have a dictionary of each tag and it's replacement injection. 

this needs to happen after the model finishes creating the html with the placeholders.

### Data injection flow

the html snippet will be served as an iframe in my site, and the data will be passed via post messages to event that will be injected via env variable in server. This will return the current results of a specific cube - array of obejcts just like in 'package-run-results'.

the prompt needs to know to make the code to wait for data to reach window.data via postMessages. also, when we present the final product to the user, we need to inject it in the same way. 

we also need to inject the html code at the bottom of the body a post message listener to that event name and assign the incoming value into window.data.


## Client
The Client is responsible to be the face of this site. it is important to use the important tools so that it looks as best as possible.


# Technical specification

- monorepo - each service in a folder
- makefile for managing python and typescript interfaces
- frontend - typescript + react with vite. 
- frontend - use zod for schema checking.
- frontend - use shadcn and tailwind.
- backend will statically serve the frontend
- There should be only one dockerfile - one service that does everything. 
- every request will go through the backend. including requests to flapi
- single dockerfile for the entire project.
- plan the site like a multistep form. find a library that can do it.
- the langchain project and the fastapi project should be in different folders and should be built separately.
- each service must have a way to be tested via command line
- frontend must have playwright testing to interact with chrome and see how it looks and whether it is working. 
- flapi will have to be fully mocked
- run a local qwen model with a vllm on this machine to have a model to test your langchain code with it.
- **Local vLLM + Docker Compose (offline-capable):** `mocks/docker-compose.yaml` runs core services (Redis, mocks, MinIO) and `mocks/docker-compose.models.yaml` runs CPU-friendly `vllm-openai-cpu` services. Use one vLLM at a time to save memory (e.g. `docker compose -f docker-compose.yaml -f docker-compose.models.yaml up redis-stack mocks vllm-gemma`). First run with internet to download models; then set `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1` for offline. Model cache is in a named volume `hf_cache`.
- frontend colors - dark themed with cyan as main color and white and secondary.
- when using redis any key should have a 12h ttl.
- use socketio if needed.
- you only have one redis
- mocks should have their own folder
- in ui you need to have indicitive errors as well as console errors in devtools. assume that any request can fail at any point, including the socket itself. 

## Local vLLM and Docker Compose (offline-capable)

From `mocks/`:

1. **One-time with internet:** bring up core + model compose files and one vLLM service so models download into `hf_cache`.
   ```bash
   cd mocks && docker compose -f docker-compose.yaml -f docker-compose.models.yaml up -d redis-stack vllm-gemma
   # or: docker compose -f docker-compose.yaml -f docker-compose.models.yaml up -d redis-stack vllm-qwen
   ```
2. **Offline:** set `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1` in the environment (e.g. in `mocks/.env`) and start the same way; vLLM will load from cache.

**Models (under 10B, good for coding):**

| Service     | Model                          | Host port | MODEL_URL / MODEL_NAME |
|------------|---------------------------------|-----------|-------------------------|
| `vllm-gemma` | **Qwen 2.5 Coder 1.5B** (Qwen/Qwen2.5-Coder-1.5B-Instruct) | 8010      | `http://localhost:8010/v1`, `Qwen/Qwen2.5-Coder-1.5B-Instruct` |
| `vllm-qwen`  | **DeepSeek Coder 1.3B** (deepseek-ai/deepseek-coder-1.3b-instruct) | 8011      | `http://localhost:8011/v1`, `deepseek-ai/deepseek-coder-1.3b-instruct` |

Copy `env.example` to `.env` and set `MODEL_URL` / `MODEL_NAME` to the row above for the service you run. Run only one vLLM service at a time if GPU memory is limited.

# Global Mission Order Planning
- write an md file called "server-spec.md" that will reprensent exactly which routes the server will have and what each returns. this can also include 
- create flapi mock according to what explained above.
- create mock server according to the md so that the client can work independently.
- create client and server simultaniously. Testing the server and agent should be TDD completely.
- integrating client and server.

# Agent splitting
Agent #0 - server-spec.md creator
Agent #1 - Flapi Mock + server mock + client creation
Agent #2 - Server + Model Mock + langchain
