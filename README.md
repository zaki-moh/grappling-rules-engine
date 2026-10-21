# Grappling Rules Engine

An experimental BJJ video analysis app built with Next.js, TypeScript, FastAPI, and OpenCV. It provides a timeline and video review workflow for exploring grappling positions and events.

## Current Features

- Upload match footage and review timestamped position segments and events.
- Detect potential scrambles using frame differencing and motion stability checks.
- Confirm, correct, or reject timeline items and add review notes.
- View match analytics that reflect reviewer corrections.

## Current Limitations

Position classification and submission detection currently use placeholder logic. Events are derived from the position timeline, so those outputs are demonstrations rather than validated detections. Ruleset selection is available, but automatic ruleset-based scoring is not implemented.

## Demo

<img width="1406" height="666" alt="image" src="https://github.com/user-attachments/assets/bcaba4b8-c219-4aa9-aefa-6147c901202c" />
<img width="1406" height="666" alt="image" src="https://github.com/user-attachments/assets/adfc8ed2-1e45-407d-8e6b-369638c0c433" />
<img width="1408" height="669" alt="image" src="https://github.com/user-attachments/assets/643b0bbc-c377-430c-91a6-2fb249f90609" />
