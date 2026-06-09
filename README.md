## **Coding Woolfs**
<img width="1280" height="960" alt="photo_2026-06-09_18-47-51" src="https://github.com/user-attachments/assets/ff58a734-04cc-4eb5-98b3-7c44569de646" />


## **Team Members**

| Name | GitHub Handle | Role(s) |
| :--- | :--- | :--- |
| Andor Tamás | [@tammasandor](https://github.com/tamasandor) | Backend, DevOps |
| Dasha Yarkovska | [@daryark](https://github.com/daryark) | e.g. UX, Pitcher |
| Lais Kurdy  | [@lkurdy ](https://github.com/lkurdy ) | Backend, Architecture |
| Marianna Zhukova | [@fraumarzhuk](https://github.com/fraumarzhuk) | Frontend, UX, Pitcher |
| Mariia Peretiatko | [@MariPeretiatko](https://github.com/MariPeretiatko) | e.g., Backend, Frontend, UX, Pitcher |
| Oscar Kerscher | [@kawaiiotta](https://github.com/kawaiiotta) | e.g., Backend, Frontend, UX, Pitcher |


Access the deployed version via : http://hackathon.tamasandor.de/
## **Challenge: Machine Whisperer**
Optimize manufacturing maintenance efficiency by building an AI-assistant.
<br>
Synthesize dense technical documentation into actionable guidance.

## **Core Idea**
Deliver exact troubleshooting solution directly to shop-floor.

## **MVP**
### AI-assistant that reduses the estimated downtime for the machine up to 85% time.<sup>1</sup>
Machine Whisperer makes knowledge searchable, reusable and improves with every accident.
<br>
Minimizes dependency on individual specialists and preserving expert knowledge.
<br>

- [X] Text, voice and photo troubleshooting.
- [X] Step-by-step AI-assistant guidance (with references to the source documentation).
- [X] Case memory for attempted actions and successful fixes.
- [X] Cross-machine knowledge from similar models and previous repair cases.
- [X] Access to machine history, maintainance logs, shift books and technician notes.
<br>
<sub><sup>1</sup> AI-assistant with case memory and smart search estimated troubleshooting time: ~5-10mins</sub>
<br>
<sub>Manual troubleshouting estimated time ~20-50mins or even more in worst case scenario.</sub>


## **Future iteration plan**
#### Cross-factory expert knowledge network:
In future iterations, the platform can aggregate anonymized maintenance knowledge across multiple factories, enabling organizations to benefit from collective operational experience and continuously improving recommendations.

#### AI maintenance copilot
Use smart glasses to detect the machine type, error and guide the technician via the troubleshooting process, directly pointing on the details need to be repaired visually and talking without a need to recieve the previous description in text prompt.

## **Tools & Integrations**
- AWS
- MongoDB
- Kiro

## **Schema and Data modeling**
#### Data used to create the seed:
- https://mdcplus.fi/blog/cnc-error-codes-complete-guide
- https://docs.automation.boschrexroth.com/unit/1317273920/error-classes-and-error-responses/latest/en/
- https://mdcplus.fi/blog/mazak-cnc-error-codes-explained-and-how-to-fix-them/

- Schemas
- Schemas


#### Our solution: 
*[Sketch your technical architecture or data flow to help understand your technical approach. You can edit the mermaid chart below:]*

```mermaid
graph LR;
    subgraph Edge / Hardware
        Sensor[IoT Sensor / Device] -->|MQTT| Gateway[Edge Gateway]
    end
    
    subgraph Cloud / Backend
        Gateway -->|Data Ingestion| API[AWS API Gateway]
        API <--> DB[(MongoDB)]
        API <--> ML[AI/ML Model]
    end
    
    subgraph Client / UI
        API -->|REST / GraphQL| App[Web / Mobile Dashboard]
    end
