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


# Access the deployed version via: https://hackathon.tamasandor.de/
<br>

## **Challenge: Machine Whisperer**
> Optimize manufacturing maintenance efficiency by building an AI-assistant.
> <br>
> Synthesize dense technical documentation into actionable guidance.

## **Core Idea**
#### Deliver exact troubleshooting solution directly to shop-floor.
<br>

## **MVP**
### AI-assistant that reduses the estimated downtime for the machine up to 85% time.<sup>1</sup>
> Machine Whisperer makes knowledge searchable, reusable and improves with every accident.
> <br>
> Minimizes dependency on individual specialists and preserving expert knowledge.
<br>

- [X] Text, voice and photo troubleshooting.
- [X] Step-by-step AI-assistant guidance (with references to the source documentation).
- [X] Case memory for attempted actions and successful fixes.
- [X] Cross-machine knowledge from similar models and previous repair cases.
- [X] Access to machine history, maintainance logs, shift books and technician notes.
<br>

> [!NOTE]
> <sup>1</sup> AI-assistant with case memory and smart search estimated troubleshooting time: ~5-10mins
> <br>
> Manual troubleshouting estimated time ~20-50mins or even more in worst case scenario.
<br>

## **Future iteration plan**
### Cross-factory expert knowledge network:
In future iterations, the platform can aggregate anonymized maintenance knowledge across multiple factories, enabling organizations to benefit from collective operational experience and continuously improving recommendations.
<br>

### AI maintenance copilot
Use smart glasses to detect the machine type, error and guide the technician via the troubleshooting process, directly pointing on the details need to be repaired visually and talking without a need to recieve the previous description in text prompt.
<br>

### Predictive Maintenance & Failure Intelligence
The system continuously analyzes historical incidents across machines, components, and repair outcomes to identify failure patterns and correlations. Using historical maintenance data, the system can predict when a component is approaching its expected service life.
> "If historical data shows that Component B frequently fails after Component A, the AI can warn technicians before the secondary failure occurs."

> [!IMPORTANT]
> As the dataset grows across multiple factories, the platform evolves from a troubleshooting assistant into a predictive maintenance system

Machine Whisperer is growing to be capable of:
- Anticipating failures before they occur
- Optimizing spare parts inventory
- Reducing machine downtime
- Supporting reliability engineering and continuous product improvement
<br>

## **Tools & Integrations**
<img width="120" height="120" alt="bedrock" src="https://github.com/user-attachments/assets/a8ecd9b9-c230-4656-ba1c-88b75b540bfc" />
<img width="120" height="120" alt="Vorschaubild-MongoDB-Atlas (1)" src="https://github.com/user-attachments/assets/10dbfb63-ce52-4490-82cf-ee90a0f7b557" />
<br>

## **Data modeling**
#### Data used to create the seed:
- https://mdcplus.fi/blog/cnc-error-codes-complete-guide
- https://docs.automation.boschrexroth.com/unit/1317273920/error-classes-and-error-responses/latest/en/
- https://mdcplus.fi/blog/mazak-cnc-error-codes-explained-and-how-to-fix-them/
- generated history/logs data parts.

#### The app uses MongoDB with synthetic industrial machine data.
Collections:
- cnc_events
- machines
- resolutions
- shirt_notes

#### Seed data example and fields
> [!NOTE]
> The following document is a representative sample from the synthetic MongoDB seed dataset.
> It shows the structure of a machine entity used by the application.
> <br>
> <br>
> The full dataset contains additional document types, including machine status data, error logs, maintenance records, part-level information, and prediction-related data. Only one sample is shown here to keep the
documentation readable.
> <br>

```
{
  "_id": {
    "$oid": "6a28131b950823bca78e08f2"
  },
  "timestamp": "2026-04-06T19:02:04.591044+00:00",
  "machine": {
    "id": "cnc_mazak_02",
    "name": "Mazak QTN-200",
    "manufacturer": "Mazak",
    "controller": "Mazatrol"
  },
  "error": {
    "nativeCode": "203",
    "conditionType": "ACTUATOR",
    "conditionState": "Fault",
    "description": "ATC arm fault",
    "causes": [
      "Tool changer incomplete sequence",
      "Tool pot sensor fault"
    ],
    "fixHint": "Check ATC sensors, verify air pressure",
    "qualifier": "HIGH"
  },
  "mtconnect": {
    "dataItemId": "cnc_mazak_02_cond_2",
    "sequence": 660296,
    "componentType": "Controller"
  },
  "status": "CLEARED",
  "resolvedAt": "2026-04-06T21:18:27.591044+00:00",
  "durationSeconds": 8183,
  "recurrenceIndex": 4,
  "shift": "afternoon",
  "plant": "Munich"
}
```



#### Our solution architecture: 
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
