const data = {
  description: "Festac Town, Lagos, Nigeria",
  matched_substrings: [{ length: 1, offset: 0 }],
  place_id: "ChIJCT-5isWIOxAR4j5BYipLebo",
  reference: "ChIJCT-5isWIOxAR4j5BYipLebo",
  structured_formatting: {
    main_text: "Festac Town",
    main_text_matched_substrings: [[Object]],
    secondary_text: "Lagos, Nigeria",
  },
  terms: [
    { offset: 0, value: "Festac Town" },
    { offset: 13, value: "Lagos" },
    { offset: 20, value: "Nigeria" },
  ],
  types: ["geocode", "neighborhood", "political"],
};

const dataSample2 = [
  {
    address_components: [
      { long_name: "Kanene", short_name: "Kanene", types: [Array] },
      { long_name: "6P38+P26", short_name: "6P38+P26", types: [Array] },
      {
        long_name: "Nick Azinge Street",
        short_name: "Nick Azinge St",
        types: [Array],
      },
      { long_name: "Umuagu", short_name: "Umuagu", types: [Array] },
      { long_name: "Asaba", short_name: "Asaba", types: [Array] },
      { long_name: "West End", short_name: "West End", types: [Array] },
      {
        long_name: "Oshimili South",
        short_name: "Oshimili South",
        types: [Array],
      },
      { long_name: "Delta", short_name: "DT", types: [Array] },
      { long_name: "Nigeria", short_name: "NG", types: [Array] },
      { long_name: "320242", short_name: "320242", types: [Array] },
    ],
    formatted_address:
      "6P38+P26 Kanene, Nick Azinge St, Umuagu, Asaba 320242, Delta, Nigeria",
    geometry: {
      bounds: { northeast: [Object], southwest: [Object] },
      location: { lat: 6.2042459, lng: 6.714991899999999 },
      location_type: "ROOFTOP",
      viewport: { northeast: [Object], southwest: [Object] },
    },
    navigation_points: [{ location: [Object] }],
    place_id: "ChIJn4KYDIXyQxARAvbFhUposNk",
    types: ["premise", "street_address"],
  },
];

const suggestions = [
  {
    description: "Asaba, Nigeria",
    matched_substrings: [[Object]],
    place_id: "ChIJOb1hsLKSQxARiZS-ytsRlnQ",
    reference: "ChIJOb1hsLKSQxARiZS-ytsRlnQ",
    structured_formatting: {
      main_text: "Asaba",
      main_text_matched_substrings: [Array],
      secondary_text: "Nigeria",
    },
    terms: [[Object], [Object]],
    types: ["geocode", "locality", "political"],
  },
  {
    description: "Anambra, Nigeria",
    matched_substrings: [[Object]],
    place_id: "ChIJ-cKEFhqFQxAR0LT76AGtYs8",
    reference: "ChIJ-cKEFhqFQxAR0LT76AGtYs8",
    structured_formatting: {
      main_text: "Anambra",
      main_text_matched_substrings: [Array],
      secondary_text: "Nigeria",
    },
    terms: [[Object], [Object]],
    types: ["administrative_area_level_1", "geocode", "political"],
  },
  {
    description: "Awka, Nigeria",
    matched_substrings: [[Object]],
    place_id: "ChIJU-eUi72CQxARU0e9iuuRI88",
    reference: "ChIJU-eUi72CQxARU0e9iuuRI88",
    structured_formatting: {
      main_text: "Awka",
      main_text_matched_substrings: [Array],
      secondary_text: "Nigeria",
    },
    terms: [[Object], [Object]],
    types: ["geocode", "locality", "political"],
  },
  {
    description: "asaba Delta state, Dennis Osadebay Way, Asaba, Nigeria",
    matched_substrings: [[Object]],
    place_id: "ChIJNQREV0TzQxARZeBGAkPu_rA",
    reference: "ChIJNQREV0TzQxARZeBGAkPu_rA",
    structured_formatting: {
      main_text: "asaba Delta state",
      main_text_matched_substrings: [Array],
      secondary_text: "Dennis Osadebay Way, Asaba, Nigeria",
    },
    terms: [[Object], [Object], [Object], [Object]],
    types: ["establishment", "place_of_worship", "point_of_interest"],
  },
  {
    description:
      "Asaba International Airport, Asaba International Airport, Asaba, Nigeria",
    matched_substrings: [[Object]],
    place_id: "ChIJDxCG60DxQxARigErC_uwPKY",
    reference: "ChIJDxCG60DxQxARigErC_uwPKY",
    structured_formatting: {
      main_text: "Asaba International Airport",
      main_text_matched_substrings: [Array],
      secondary_text: "Asaba International Airport, Asaba, Nigeria",
    },
    terms: [[Object], [Object], [Object], [Object]],
    types: ["airport", "establishment", "point_of_interest"],
  },
];
