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

## **Challenge: Machine Whisperer**
Optimize manufacturing maintenance efficiency by building an AI-assistant.
Synthesize dense technical documentation into actionable guidance.

## **Core Idea**
Deliver exact troubleshooting solution directly to shop-floor.

## **MVP**
Machine Whisperer is an AI-powered maintenance assistant designed for manufacturing environments. It provides operators and technicians with a real-time overview of machine health and maintenance history across the factory floor.

The application provides:
- AI-assisted troubleshooting through text, voice, photo.
- Step-by-step repair guidance (with references to the source documentation).
- Case memory for attempted actions and successful fixes.
- Access to machine history, maintainance logs, shift books and technician notes.
- Cross-machine knowledge from similar models and previous repair cases.

##### By learning from past maintenance activities and preserving expert knowledge, Machine Whisperer reduces downtime, accelerates fault diagnosis, and minimizes dependency on individual specialists. 

## **Future iteration plan**
#### Cross-factory expert knowledge network:
In future iterations, the platform can aggregate anonymized maintenance knowledge across multiple factories, enabling organizations to benefit from collective operational experience and continuously improving recommendations.

#### AI maintenance copilot
Use smart glasses to detect the machine type, error and guide the technician via the troubleshooting process, directly pointing on the details need to be repaired visually and talking without a need to recieve the previous description in text prompt.


Create an App with

Problem: Knowledge leaves in manuals and people heads.
#### Our solution: AI-assistant ####
- makes knowledge searchable, reusable and improves with every accident
- reduses the estimated downtime for the machine up to 85% time.*

<sub>*AI-researched solution with smart search and history ~5-10mins</sub>
<br>
<sub>while manual troubleshouting takes ~20-50mins or even more in worst case scenario.</sub>

<br>

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
