// src/data/resume.js
//
// The résumé, as everyone sees it. This one is in the repository on purpose:
// a résumé is written to be read, and a portfolio that hides it is a portfolio
// missing a page.
//
// What is not here is the phone number. The rest of a résumé — where Alex
// studies, what he has built, what he has won — is what a résumé is for; a
// phone number on a public page is for whoever scrapes it. The copy kept off
// the repository still carries the full version, and takes precedence where it
// exists, so the site on Alex's own machine shows the number and the published
// one does not.
//
// src/components/Resume.jsx lays this out; the words are all here.
export const RESUME = {
    name: 'Alex Chang',
    links: ['a-cccc.github.io/portfolio', 'azschang@gmail.com'],
    summary: 'Interested in applying design skills to solve everyday problems.',
    sections: [
      {
        title: 'Education',
        entries: [
          {
            heading: 'Bullis School',
            place: 'Potomac, MD',
            role: 'Class of 2028',
            note: 'Unweighted GPA = 98.33/100 (4.0), weighted GPA = 102.50/100 (4.60)',
          },
        ],
      },
      {
        title: 'Experience',
        entries: [
          {
            heading: 'Johns Hopkins Center for Talented Youth \u2014 Dickinson College',
            place: 'Carlisle, Pennsylvania',
            role: 'Cognitive Psychology Participant',
            when: 'Jun 2025 \u2013 Jul 2025',
            points: [
              'Attended seven hours daily classes with a cognitive psychology professor.',
              'Engaged in projects and conversations about cognitive psychology topics.',
              'Conducted study with participants measuring overcoming functional fixedness.',
              'Presented research on problem-solving methods and associated strategies and cognitive biases.',
            ],
          },
          {
            heading: 'Georgetown University / Leadership Initiatives',
            place: 'District of Columbia',
            role: 'Neuroscience Intern',
            when: 'Jul 2025',
            points: [
              'Attended daily neuroscience lectures at Georgetown University with leaders like Dr. James Giordano on bioethics.',
              'Collaborated with a team of 8 to conduct a literature review of Multiple Sclerosis (MS) causes, current treatments, and future research.',
              'Proposed actionable solution to enhance effectiveness of treatments by using nanoparticles for drug delivery.',
              'Delivered PowerPoint presentation background research and engineered solutions to professors and competing teams.',
            ],
          },
          {
            heading: "George Mason University Aspiring Inventor's Program",
            place: 'Fairfax, Virginia',
            role: 'Inventor',
            when: 'Jun 2026 \u2013 Aug 2026',
            points: [
              'Selected for a competitive program to develop a project capable of being patented.',
              'Collaborated in a two-person team to develop a working prototype for a patentable project.',
              'Learned the basics of patents and brainstorming in the problem space.',
              'Conducted deep prior art research to explore existing solutions and patents in the problem space.',
              'Developed needs statements applying to our problem space.',
              'Built a working prototype for a smart kinesiology tape to track joint movement, overextension, and hydration for recovery.',
              'Completed a patent disclosure form and designed a research poster to showcase our methods and results.',
              'Presented results in a gallery-walk format to investors, professors, and patent attorneys.',
            ],
          },
        ],
      },
      {
        title: 'Extracurricular Activities',
        list: [
          'D.C. National Rowing Club (2024 \u2013 Present)',
          'Piano (2015 \u2013 2025, Private 2015\u20132020, Levine School of Music 2020\u20132025)',
          'Norwood School Debate Team (2022 \u2013 2024)',
          'MSI Soccer (2016 \u2013 2024)',
        ],
      },
      {
        title: 'Awards',
        list: [
          'Bullis School 2026 Class of 2028 STEM Award',
          "24th Place 2026 USRowing Youth National Championship Men's U17 8+",
          "3rd Place 2026 USRowing Mid-Atlantic Youth Regional Championship Men's U17 8+",
          '3rd Place 2026 Mercer Sprints 3rd Varsity 4+',
          '1st Place 2024 Bill Braxton Memorial Regatta HS Novice 8+',
          'MSI Soccer 2nd Place Team Spring 2022',
          'Levine School of Music Godowsky Class Nomination',
          'Norwood School Debate 15th, (2) 5th, and 4th Place Team Awards',
          'Norwood School Debate 13th, 6th, and 5th Place Speaker Awards',
          'Summa Cum Laude (2023, 2024, 2026) National Latin Exam',
          'Perfect Score 2026 National Latin Exam',
          "Norwood School Head of School's Prize",
          'Norwood School Ronald B. Goyette and Debra L. Pakaluk Community Service Award',
        ],
      },
      {
        title: 'Skills',
        list: [
          '3D Modeling (AutoDesk Fusion)',
          '3D Printing (PrusaSlicer)',
          'Animation (Blender)',
          'Google Workspace (Google Docs, Slides, Sheets, and Drive)',
          'Presentations (Google Slides and PowerPoint)',
          'Visual Design (Adobe Illustrator, Adobe Photoshop, Canva)',
          'Design (Spatial design)',
          'AI (Claude, Claude Code, ChatGPT, Gemini, DALL-E, Perplexity)',
          'Electronics (Arduino)',
        ],
      },
    ],
  }
