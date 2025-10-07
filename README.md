Veritas AI - Backend Documentation
1. Vision & Mission
Veritas AI is an intelligent co-pilot designed to transform the insurance claims processing industry in West Africa. It combats sophisticated, multi-billion naira fraud by replacing slow, manual, and error-prone investigations with AI-powered forensic analysis.

This backend system is the engine that drives the platform, providing a secure, scalable, and intelligent foundation for the entire Veritas AI workflow.

2. Core Architecture
The Veritas AI backend is built as a monolithic FastAPI Web Service, designed for straightforward deployment on platforms like Render. It follows a simple, robust request-response model that handles everything from claim creation to deep forensic analysis in a single, powerful workflow.

The architecture is centered around a crucial endpoint: /trigger-analysis. When called, this endpoint orchestrates a series of operations that replicate a full forensic pipeline, ensuring that even with a simple architecture, no analytical depth is lost.

Key Architectural Decisions:
Unified Server Process: All tasks, including long-running analyses, are handled within the API server. This simplifies deployment by avoiding the need for separate worker processes or message queues (like Redis).

Bypassing Textract: To overcome AWS account activation issues (SubscriptionRequiredException), this system does not use Amazon Textract. Instead, it leverages the powerful multimodal capabilities of Amazon Bedrock (Claude 3 Sonnet) for all Optical Character Recognition (OCR) tasks on documents and images.

Intelligent Co-pilot Context: The system makes the AI Co-pilot (Amazon Q) "smart" by using the Conversation Context method. After each analysis, a detailed summary file is created and uploaded. The co-pilot is then instructed to read this specific file at the beginning of each chat, giving it full context for the claim being investigated.

3. The Forensic Workflow: A Step-by-Step Journey
This is how the backend processes a claim from start to finish:

Step 1: Authentication (/auth)
A claims adjuster must first register or log in. The backend provides /signup and /token endpoints to manage secure, token-based authentication using JWT. Every subsequent request must include this token.

Step 2: Claim Creation (POST /claims)
The adjuster provides initial notes ("additional info") and the number of files they will upload. The backend:

Creates a new claim record in the MongoDB database.

Generates a unique, secure S3 upload link for each file.

Saves the list of generated file keys (s3_keys) to the claim record. This is crucial for the analysis step.

Returns the upload links and the claim_id to the frontend.

Step 3: File Upload (Frontend to S3)
The frontend uploads the files directly to the secure S3 bucket using the provided links. The backend is not involved in this step.

Step 4: The Analysis Trigger (POST /claims/{claim_id}/trigger-analysis)
This is the heart of the system. When the adjuster clicks "Run Analysis," this long-running endpoint is called. It performs the entire forensic pipeline in order:

It retrieves the list of s3_keys from the claim record in the database.

For each file, it performs a deep analysis:

Text Extraction: It calls Amazon Bedrock to read and extract all text from the file, whether it's a PDF or an image.

Image Forensics (if applicable): If the file is an image, it undergoes a multi-layered investigation:

Metadata (EXIF): Extracts the photo's creation date, time, and camera model.

Content Analysis: Uses Amazon Rekognition to detect objects and text within the image.

Reverse Image Search: Uses the Google Custom Search API to check if the image has appeared online before.

Video Files: Are explicitly identified and skipped to prevent server timeouts.

Synthesize Findings: After all files are processed, the backend collects all the extracted intelligence (adjuster's notes, extracted text, forensic reports). It constructs a detailed, master forensic prompt and sends it to Amazon Bedrock.

Generate Verdict: Bedrock returns the final report (summary, fraud risk score, key factors), which is saved to the claim record in the database.

Step 5: Co-pilot Context Creation
Immediately after saving the verdict, the backend:

Creates a new, detailed text file containing the final report and all extracted text.

Uploads this "context file" to a separate S3 bucket designated as the data source for Amazon Q.

Step 6: The Investigation (/investigate)
When the adjuster opens the AI Co-pilot chat:

The frontend first calls /investigate/{claim_id}/start-conversation. The backend reads the context file from S3 and starts a new conversation with Amazon Q, pre-loading it with the full case file. It returns a conversationId.

For every follow-up question, the frontend calls /investigate/{claim_id}/query, sending the question and the conversationId. The backend passes this to the existing, context-aware conversation, allowing the adjuster to have an intelligent chat about the specifics of the claim.

4. API Endpoints
Method

Endpoint

Description

Authentication

POST

/auth/signup

Creates a new user account.

None

POST

/auth/token

Logs in an existing user and returns a JWT access token.

None

GET

/claims/

Retrieves a list of all claims created by the logged-in user.

Required

POST

/claims/

Creates a new claim record and returns S3 upload URLs.

Required

GET

/claims/{claim_id}

Retrieves the full details and analysis results of a single claim.

Required

POST

/claims/{claim_id}/trigger-analysis

(Core Function) Initiates the full, long-running forensic analysis for a claim.

Required

POST

/investigate/{claim_id}/start-conversation

Starts a new, context-aware conversation with the AI Co-pilot for a specific claim.

Required

POST

/investigate/{claim_id}/query

Sends a follow-up question to an existing AI Co-pilot conversation.

Required

5. Setup & Deployment
Environment: Copy the .env.example file to .env and fill in all the required values for your MongoDB, AWS, and Google API keys.

Dependencies: Install all required packages by running pip install -r requirements.txt.

Local Development: Run uvicorn main:app --reload to start the server locally.

Deployment (Render):

Push the code to a GitHub repository.

Create a new Web Service on Render, pointing to your repository.

Select Docker as the environment.

Manually add all variables from your .env file to the Environment Variables section in the Render dashboard.