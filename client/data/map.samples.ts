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
      [Object],
      [Object],
      [Object],
      [Object],
      [Object],
      [Object],
      [Object],
      [Object],
    ],
    formatted_address: "6P59+4M8, Isieke, Asaba 320242, Delta, Nigeria",
    geometry: {
      bounds: [Object],
      location: [Object],
      location_type: "ROOFTOP",
      viewport: [Object],
    },
    navigation_points: [[Object]],
    place_id: "ChIJLd60T5DyQxARHyP968JIjUA",
    types: ["premise", "street_address"],
  },
];

const address_components = [
  { long_name: "186", short_name: "186", types: ["street_number"] },
  { long_name: "Nnebisi Road", short_name: "Nnebisi Road", types: ["route"] },
  {
    long_name: "Isieke",
    short_name: "Isieke",
    types: ["neighborhood", "political"],
  },
  { long_name: "Asaba", short_name: "Asaba", types: ["locality", "political"] },
  {
    long_name: "Agu",
    short_name: "Agu",
    types: ["administrative_area_level_3", "political"],
  },
  {
    long_name: "Oshimili South",
    short_name: "Oshimili South",
    types: ["administrative_area_level_2", "political"],
  },
  {
    long_name: "Delta",
    short_name: "DT",
    types: ["administrative_area_level_1", "political"],
  },
  { long_name: "Nigeria", short_name: "NG", types: ["country", "political"] },
  { long_name: "320242", short_name: "320242", types: ["postal_code"] },
];
