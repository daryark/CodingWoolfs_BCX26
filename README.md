# **Your Team at a Glance**

## **CodingWoolfs**


> 💡 **Tip:** Create a sheet of paper with your team name on the desk so mentors and organizers can find you easily! 

*[Feel free to include a picture representing your team here]*

## **Team Members**

| Name | GitHub Handle | Role(s) |
| :--- | :--- | :--- |
| Andor Tamás | [@tammasandor](https://github.com/tamasandor) | Backend, DevOps |
| Dasha Yarkovska | [@daryark](https://github.com/daryark) | e.g., Backend, Frontend, UX, Pitcher |
| Lais Kurdy  | [@lkurdy ](https://github.com/lkurdy ) | Backend, Architecture |
| Marianna Zhukova | [@fraumarzhuk](https://github.com/fraumarzhuk) | Frontend, UX, Pitcher |
| Mariia Peretiatko | [@MariPeretiatko](https://github.com/MariPeretiatko) | e.g., Backend, Frontend, UX, Pitcher |
| Oscar Kerscher | [@kawaiiotta](https://github.com/kawaiiotta) | e.g., Backend, Frontend, UX, Pitcher |

## **Challenge**

*MachineWhisperer*

## **Core Idea**

*[What is your rough solution idea?]*

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
