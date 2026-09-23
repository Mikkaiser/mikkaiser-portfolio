// Single source of truth for the CV. Kept in sync with the site copy and lib/bio.ts.
// Where the old resume and the site disagreed, the stronger claim was kept:
// 6+ years (not 5+) and 500+ trained (not 400+). The ACTVET role is titled
// "Senior Software Engineer"; "Software Development Expert" is the EmiratesSkills
// designation and is carried in the headline and the awards section instead.
export const cv = {
  name: "Mikael Ribeiro Simoes",
  title: "Senior Software Engineer · Software Development Expert",
  contact: [
    "Abu Dhabi, UAE",
    "+971 56 766 4593",
    "mikkaiser.ribeiro@gmail.com",
    "mikkaiser.com",
    "linkedin.com/in/mikael-ribeiro",
    "github.com/Mikkaiser",
  ],
  summary:
    "Full stack software developer with 6+ years across backend architecture, enterprise systems and the front ends on top of them. Deep expertise in .NET, ASP.NET Core and Node.js, shipping production APIs, microservices and CI/CD pipelines. Contributed to platforms serving 780,000+ users, trained 500+ students and professionals, and won two WorldSkills gold medals in Software Applications Development. Chief Expert for the United Arab Emirates in the same skill.",
  stack: [
    ["Backend", "C# · .NET / ASP.NET Core · Node.js · NestJS · REST · GraphQL"],
    ["Frontend", "Angular · TypeScript · React · Next.js · SASS · HTML/CSS"],
    ["Databases", "SQL Server · Oracle DB · MySQL · MariaDB · Redis · TypeORM · Sequelize · Entity Framework"],
    ["DevOps & Cloud", "Microsoft Azure · Azure Pipelines · GitHub Actions · GitLab CI · Docker · Kubernetes"],
    ["Testing", "xUnit · Jest · Jasmine · Automated testing pipelines"],
    ["Observability", "Grafana · Prometheus · Loki"],
    ["Mobile", "React Native (Android & iOS)"],
    ["Integrations", "SAP · Microservices architecture · WordPress / CMS"],
  ],
  experience: [
    {
      role: "Senior Software Engineer",
      org: "ACTVET",
      place: "Abu Dhabi, UAE",
      when: "09/2023 — Present",
      points: [
        "Design and deliver internal platforms in .NET, ASP.NET Core, Next.js and SQL Server / MariaDB, supporting training management, performance tracking and operational workflows for 200+ active users.",
        "Architect full .NET stack solutions (C#, ASP.NET Core Web API, Entity Framework Core, WinForms, xUnit) for national and international competition training programmes, from database design and REST APIs through automated testing and desktop applications.",
        "Implement secure APIs and CI/CD pipelines via GitHub Actions and Azure Pipelines; automated testing with xUnit reduced deployment issues by 30%.",
        "Lead technical instruction for 500+ students and professionals across ATS schools, HCT and Khalifa University, in international, multicultural environments.",
        "Deliver enterprise-scale software aligned with multi-year business lifecycles, ensuring reliability and long-term maintainability.",
      ],
    },
    {
      role: "Full Stack Developer",
      org: "Radix Engineering & Software",
      place: "Rio de Janeiro, Brazil",
      when: "01/2023 — 09/2023",
      points: [
        "Supported 15 microservices and 3+ enterprise platforms in production; stabilised SotreqLink, serving roughly 5,000 internal users and field technicians.",
        "Resolved 50+ production incidents per month through root cause analysis, reducing recurring failures by 35% and delivering 100+ corrective fixes and feature updates.",
        "Built backend services with ASP.NET Core and ASP.NET MVC; optimised data access via Oracle DB and Redis, improving response times by 20-30%.",
        "Managed cloud infrastructure and CI/CD on Microsoft Azure; deployed Grafana, Loki and Prometheus, cutting incident detection time by 40%.",
        "Maintained 99.9% availability on Docker and Kubernetes; scaled automated test coverage to 75%.",
        "Shipped a React Native app for 200+ field technicians (Android & iOS) and integrated SAP workflows processing thousands of financial transactions monthly.",
      ],
    },
    {
      role: "Full Stack Developer",
      org: "SENAI Alagoas",
      place: "Maceio, Brazil",
      when: "04/2022 — 01/2023",
      points: [
        "Developed 10+ web and mobile applications for the Federation of Industries; contributed to SENAI Play, a national LMS with 780,000+ active users across Brazil.",
        "Designed REST and GraphQL APIs with NestJS / Node.js; built responsive front ends with Angular, TypeScript and SASS.",
        "Reduced production defects by 25% through automated testing with Jest and Jasmine; managed CI/CD via GitLab CI.",
        "Containerised environments with Docker and Docker Compose, cutting image size by 50%; managed MySQL and SQL Server databases.",
        "Applied Scrum across cross-functional teams and led 5+ internal training sessions on architecture and best practices.",
      ],
    },
    {
      role: "Web Developer",
      org: "SENAI Alagoas",
      place: "Maceio, Brazil",
      when: "03/2021 — 04/2022",
      points: [
        "Led end-to-end development of four WordPress projects, from requirements and implementation through to deployment.",
        "Built SENAI digital platforms with Angular and NestJS (TypeScript), integrating RESTful APIs with dynamic front ends.",
        "Applied professional standards in version control, documentation and code quality across the full development lifecycle.",
      ],
    },
  ],
  achievements: [
    ["Gold medal, Software Applications Development", "WorldSkills Americas, WorldSkills International · Nov 2021"],
    ["Gold medal, Software Applications Development", "National championship, WorldSkills Brasil / SENAI · Feb 2022"],
    ["Chief Expert for the United Arab Emirates", "Software Applications Development, EmiratesSkills (ACTVET) · owns the test project, marking scheme and judging; WorldSkills Expert for the UAE"],
    ["Speaker, 350+ developers", "Rocketseat Meetup, Maceió · Apr 2023 · the largest in Rocketseat's history"],
    ["780,000+ users on SENAI Play", "National learning platform, live across Brazil"],
    ["500+ people trained", "Students and professionals, from first loops to production architecture"],
  ],
  projects: [
    ["AUTEGE", "Workshop management for service workshops in Brazil and the UAE, public site and internal operations app. autege.com"],
    ["EmiratesSkills Competition System", "Runs the UAE national skills competition end to end, plus the public site. emiratesskills.mikkaiser.com"],
    ["Training Planner", "Planning and tracking for competition training programmes, full .NET stack. training-planner.mikkaiser.com"],
    ["TechKnowledge", "Technical publication on backend architecture and enterprise development. techknowledge.blog"],
    ["SotreqLink", "Field service platform at Radix for ~5,000 technicians, with Android and iOS apps."],
    ["SENAI Play", "National learning platform with 780,000+ active users. play.senai.br"],
  ],
  certifications: [
    ["Docker, Full Cycle Certification", "Full Cycle · Dec 2022"],
    ["NestJS, Build Modern APIs with Unit Testing", "Udemy · Jul 2022"],
    ["Design Patterns in C#", "Udemy · Sep 2021"],
    ["How to Lead and Work as a Team", "LinkedIn Learning · Oct 2021"],
  ],
  education: [
    ["BSc Computer Software Engineering", "UniCesumar Dubai · 2026 — 2030 (in progress)"],
    ["English Language and Literature, ESL", "Times Idiomas, Sao Paulo · 2022 — 2024"],
    ["Internet IT Technician", "SENAI Alagoas · 2019 — 2020"],
  ],
  languages: "Portuguese (native) · English (professional working proficiency)",
};
