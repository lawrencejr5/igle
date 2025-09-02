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
