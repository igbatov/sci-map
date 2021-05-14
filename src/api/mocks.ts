export const apiTree = {children: [
  {
    id: "1",
    title: "Mathematics",
    position: {
      x: 200,
      y: 300
    },
    wikipedia: "https://en.wikipedia.org/wiki/Mathematics",
    resources: [
      {
        type: "Textbook",
        author: "Steven Strogatz",
        name: "The Joy of x: A Guided Tour of Math, from One to Infinity",
        rate: 0,
        link:
          "https://www.amazon.com/Joy-Guided-Tour-Math-Infinity/dp/0544105850"
      }
    ],
    children: [
      {
        id: "2",
        title: "Logic",
        position: {
          x: 70,
          y: 300
        },
        wikipedia: "https://en.wikipedia.org/wiki/Logic",
        resources: [
          {
            type: "Textbook",
            author: "Wolf",
            name: "A Tour Through Mathematical Logic ",
            rate: 0,
            link:
              "https://www.scribd.com/document/332668344/R-Wolf-A-Tour-Through-Mathematical-Logic?language_settings_changed=English"
          }
        ],
        children: []
      },
      {
        id: "3",
        title: "Algebra",
        position: {
          x: 250,
          y: 300
        },
        wikipedia: "https://en.wikipedia.org/wiki/Algebra",
        resources: [
          {
            type: "Textbook",
            author: "Vinberg",
            name: "A Course in Algebra",
            rate: 5,
            link:
              "https://kupdf.net/download/vinberg-a-course-in-algebra_59c5b36508bbc5a1196871c6_pdf"
          }
        ],
        children: []
      }
    ]
  },
  {
    id: "4",
    title: "Physics",
    position: {
      x: 1000,
      y: 300
    },
    wikipedia: "https://en.wikipedia.org/wiki/Physics",
    resources: [
      {
        type: "Textbook",
        author: "Richard Feynman",
        name: "Feynman Lectures on Physics",
        rate: 5,
        link: "https://www.feynmanlectures.caltech.edu"
      }
    ],
    children: [
      {
        id: "5",
        title: "Principle of least action",
        position: {
          x: 850,
          y: 300
        },
        wikipedia: "https://en.wikipedia.org/wiki/Principle_of_least_action",
        resources: [
          {
            type: "Textbook",
            author: "Richard Feynman",
            name:
              "The Feynman Lectures on Physics, Part II, Ch 19, The Principle of Least Action",
            rate: 0,
            link: "https://www.feynmanlectures.caltech.edu/II_19.html"
          }
        ],
        children: []
      },
      {
        id: "6",
        title: "Space and time",
        position: {
          x: 1200,
          y: 300
        },
        wikipedia: "https://en.wikipedia.org/wiki/Spacetime",
        resources: [
          {
            type: "Textbook",
            author: "Brian Greene",
            name:
              "The Fabric of the Cosmos: Space, Time, and the Texture of Reality",
            rate: 0,
            link:
              "https://www.amazon.com/Fabric-Cosmos-Space-Texture-Reality/dp/0375727205"
          }
        ],
        children: []
      }
    ]
  },
  {
    id: "7",
    title: "Chemistry",
    position: {
      x: 700,
      y: 500
    },
    wikipedia: "https://en.wikipedia.org/wiki/Chemistry",
    resources: [
      {
        type: "Textbook",
        author: "Pimentel G.C., Seaborg G.T.",
        name: "Chemistry. An Experimental Science.",
        rate: 0,
        link:
          "http://chemistry-chemists.com/forum/download/file.php?id=57598&sid=e305ea11b8814ef6863f4ce8c7412753"
      }
    ],
    children: [
      {
        id: "8",
        title: "Organic",
        position: {
          x: 600,
          y: 500
        },
        wikipedia: "https://en.wikipedia.org/wiki/Organic_chemistry",
        resources: [],
        children: []
      },
      {
        id: "9",
        title: "Inorganic",
        position: {
          x: 900,
          y: 500
        },
        wikipedia: "https://en.wikipedia.org/wiki/Inorganic_chemistry",
        resources: [],
        children: []
      }
    ]
  }
]};
