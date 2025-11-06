export interface DriverRequest {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  vehicleType: "Cab" | "Bike" | "SUV" | "Keke" | "Van" | "Truck";
  vehicleName: string;
  dateOfBirth?: string;
  vehicleDetails?: {
    brand: string;
    model: string;
    color: string;
    year: string;
    plateNumber: string;
    exteriorImage?: string;
    interiorImage?: string;
  };
  driverLicence?: {
    number: string;
    expiryDate: string;
    frontImage?: string;
    backImage?: string;
    selfieWithLicence?: string;
  };
  requestDate: string;
}

export const requestsData: DriverRequest[] = [
  {
    id: "REQ001",
    fullname: "Michael Johnson",
    email: "michael.j@email.com",
    phone: "+234 801 234 5678",
    vehicleType: "Cab",
    vehicleName: "Toyota Camry",
    dateOfBirth: "1990-05-15",
    vehicleDetails: {
      brand: "Toyota",
      model: "Camry",
      color: "Silver",
      year: "2020",
      plateNumber: "LAG-456-XY",
      exteriorImage:
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop",
      interiorImage:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop",
    },
    driverLicence: {
      number: "LIC-2023-45678",
      expiryDate: "2028-12-31",
      frontImage:
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop",
      backImage:
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop",
      selfieWithLicence:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop",
    },
    requestDate: "2024-11-01",
  },
  {
    id: "REQ002",
    fullname: "Sarah Williams",
    email: "sarah.w@email.com",
    phone: "+234 802 345 6789",
    vehicleType: "Bike",
    vehicleName: "Honda CBR",
    dateOfBirth: "1995-08-22",
    vehicleDetails: {
      brand: "Honda",
      model: "CBR 250R",
      color: "Red",
      year: "2021",
      plateNumber: "LAG-789-YZ",
      exteriorImage:
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop",
      interiorImage:
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop",
    },
    driverLicence: {
      number: "LIC-2023-78901",
      expiryDate: "2029-06-30",
      frontImage:
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop",
      backImage:
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop",
      selfieWithLicence:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop",
    },
    requestDate: "2024-11-03",
  },
];
