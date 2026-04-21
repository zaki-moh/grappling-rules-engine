## grappling-rules-engine
Computer vision project to help assist in BJJ scoring. Allows for rule config (IBJJF, ADCC, Custon, etc) and will score input footage based on said ruleset. It creates a timeline of "Scoring Event" (ex: Sweep, Takedown, etc), and allows for user to review these scoring events and accept/reject them based on the replay. This projects seeks to make BJJ judging more accurate and objective, it serves as a supplement for judging not a full replacement. 

## Demo
<img width="1406" height="666" alt="image" src="https://github.com/user-attachments/assets/bcaba4b8-c219-4aa9-aefa-6147c901202c" />
<img width="1406" height="666" alt="image" src="https://github.com/user-attachments/assets/adfc8ed2-1e45-407d-8e6b-369638c0c433" />
<img width="1408" height="669" alt="image" src="https://github.com/user-attachments/assets/643b0bbc-c377-430c-91a6-2fb249f90609" />


## Future Roadmap
. **Candidate Window Merging**

   The current sliding-window detector may produce several overlapping candidates for one scramble or transition. A future improvement is to merge overlapping high-motion windows into a single candidate action.

2. **Adaptive Motion Thresholding**

   The current detector uses a fixed motion threshold. Future versions can calculate thresholds dynamically based on each video’s motion profile, making the detector more robust across tripod footage, handheld footage, different lighting, and different camera angles.

3. **Pose Detection Integration**

   Integrate a pose detection model such as MediaPipe Pose, YOLO Pose, OpenPose, or MMPose to extract body keypoints from candidate windows. This would allow the system to reason about athlete posture, body orientation, standing vs. grounded positions, and major positional transitions.

4. **Athlete Tracking**

   Track the two competitors across frames so the system can maintain red/blue identity over time. This is necessary before the system can reliably assign scoring actions to the correct athlete.

5. **Position Classification**

   Build or train classifiers for common grappling positions such as standing, guard, half guard, side control, mount, back control, turtle, and scramble positions. This would help the system distinguish general motion from meaningful positional advancement.

6. **Action Classification**

   Train a model to classify candidate windows into grappling actions such as possible takedown, sweep, guard pass, back take, reversal, reset, or no-score movement. This would likely require labeled match clips with action type and timestamp ranges.

7. **Ruleset-Aware Scoring**

   Convert classified actions into scoring events based on the selected ruleset. For example, IBJJF and ADCC can score similar grappling actions differently, so the scoring layer should remain separate from the raw CV/action classification layer.

8. **Human Review Feedback Loop**

   Use user review decisions as future training data. Accepted events, rejected events, edited event types, corrected teams, and manual scoring events can become labels for improving future models.

9. **Dataset and Labeling Workflow**

   Add tools for exporting clips around candidate actions and labeling them with action type, athlete, position, and scoring outcome. This would support future supervised training and model evaluation.

10. **Model Evaluation**

   Measure precision and recall for candidate detection and action classification. The goal is not only to find scoring events, but also to minimize false positives so the review workflow remains useful.
