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
Problem: Knowledge leaves in manuals and people heads.

## **Core Idea**
#### Our solution: AI-assisted app ####
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
