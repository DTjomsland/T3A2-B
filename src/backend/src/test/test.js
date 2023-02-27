const app = require("../server.js");
const request = require("supertest");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

let cookie;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const response = await request(app).post("/user/login").send({
    email: "john@example.com",
    password: "password",
  });

  cookie = response.get("Set-Cookie");
});

afterAll(async () => {
  await mongoose.connection.close();
});

//---------User Creation----------//
describe("POST /user/register", () => {
  describe("Given firstName, lastName, email and password", () => {
    test("Should respond with 201 status", async () => {
      const response = await request(app).post("/user/register").send({
        firstName: "John",
        lastName: "Daniels",
        email: "sickemail@gmail.com",
        password: "password",
      });
      expect(response.body.firstName).toBe("John");
      expect(response.body.lastName).toBe("Daniels");
      expect(response.body.email).toBe("sickemail@gmail.com");
      expect(response.statusCode).toBe(201);
    });
  });

  describe("Given user information that already exists in the DB", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app).post("/user/register").send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password",
      });
      expect(response.body.message).toBe(
        "This email is associated with an account already."
      );
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When firstName, lastName, email and password are missing", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app).post("/user/register").send({
        firstName: "John",
        lastName: "Daniels",
      });
      expect(response.body.message).toBe("Please fill out all fields");
      expect(response.statusCode).toBe(400);
    });
  });
});

//---------User Verification----------//
describe("POST /verification/:token", () => {
  describe("Given valid verification JWT in the URL", () => {
    test("should respond with 200 status", async () => {
      const response = await request(app)
        .post(
          "/user/verification/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJpYXQiOjE2NzY3Njg5Nzh9.qCjcQ_xMutz35bDd8_olh36e5Z11thoPnXR0hrrbUUg"
        )
        .send({});
      expect(response.body.message).toBe("Email successfully confirmed.");
      expect(response.statusCode).toBe(200);
    });
  });

  describe("Given invalid verification JWT in the URL", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .post(
          "/user/verification/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImR0am9tc2xhbmRqckBnbWFpbC5jb20iLCJpYXQiOjE2NzY3NzAzMDMsImV4cCI6MTY3OTM2MjMwM30.j6uaGEE5t3rAdSj-o2YJyFQHfBzBD_mzTXY_0JVYf8g"
        )
        .send({});
      expect(response.body.message).toBe("User not found");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------User Login----------//
describe("POST /user/login", () => {
  describe("Given email and password", () => {
    test("should respond with 200 status", async () => {
      const response = await request(app).post("/user/login").send({
        email: "john@example.com",
        password: "password",
      });
      expect(response.body.message).toBe("Logged in Successfully");
      expect(response.statusCode).toBe(200);
    });
  });

  describe("When password is missing", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app).post("/user/login").send({
        email: "john@example.com",
      });
      expect(response.body.message).toBe("Please fill out all fields");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When password is wrong", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app).post("/user/login").send({
        email: "john@example.com",
        password: "password2",
      });
      expect(response.body.message).toBe("Invalid credentials");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When user is unconfirmed", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app).post("/user/login").send({
        email: "kobby@gmail.com",
        password: "password",
      });
      expect(response.body.message).toBe("Please confirm your email");
      expect(response.statusCode).toBe(400);
    });
  });
});

//---------User Info----------//
describe("GET /user", () => {
  describe("Given user ID from cookie", () => {
    test("should respond with 200 status", async () => {
      const response = await request(app)
        .get("/user")
        .set("Cookie", cookie)
        .send({});
      expect(response.statusCode).toBe(200);
    });
  });

  describe("Not given user ID from cookie", () => {
    test("should respond with 401 status", async () => {
      const response = await request(app).get("/user").send({});
      expect(response.body.message).toBe("No authorization token found");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Create Patient----------//
describe("POST /patient", () => {
  describe("When first and last name are given", () => {
    test("Should respond with 201 status", async () => {
      const response = await request(app)
        .post("/patient")
        .set("Cookie", cookie)
        .send({
          firstName: "John",
          lastName: "Stevens",
        });
      expect(response.body.firstName).toBe("John");
      expect(response.body.lastName).toBe("Stevens");
      expect(response.statusCode).toBe(201);
    });
  });

  describe("When last name is missing", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .post("/patient")
        .set("Cookie", cookie)
        .send({
          firstName: "john",
        });
      expect(response.body.message).toBe("Please fill out all fields");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When auth cookie is missing", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app).post("/patient").send({
        firstName: "john",
        lastName: "Stevens",
      });
      expect(response.body.message).toBe("No authorization token found");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Get Patient Info----------//
describe("GET /patient/:id", () => {
  describe("When valid patient ID is given in URL", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .get("/patient/63f01efe3b5704fa0aa3ddc2")
        .set("Cookie", cookie)
        .send({});
      expect(response.body).toHaveProperty("patient");
      expect(response.statusCode).toBe(200);
    });
  });

  describe("When invalid patient ID is given in URL", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .get("/patient/63f01efe3b5704fa0aa3ddc9")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("Patient not found");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When user is not affiliated with patient", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .get("/patient/63f01f0a3b5704fa0aa3ddc3")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Update Patient----------//
describe("PUT /patient/:id", () => {
  describe("When valid patient ID is given in URL", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .put("/patient/63f01efe3b5704fa0aa3ddc2")
        .set("Cookie", cookie)
        .send({
          firstName: "BIG TED",
        });
      expect(response.body.firstName).toBe("BIG TED");
      expect(response.statusCode).toBe(200);
    });
  });

  describe("When invalid patient ID is given in URL", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .put("/patient/63f01efe3b5704fa0aa3ddc5")
        .set("Cookie", cookie)
        .send({
          firstName: "BIG TED",
        });
      expect(response.body.message).toBe("Patient not found");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When valid patient ID is given, but user is not coordinator", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .put("/patient/63f01f0a3b5704fa0aa3ddc3")
        .set("Cookie", cookie)
        .send({
          firstName: "BIG TED",
        });
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Delete Patient----------//
describe("DELETE /patient/:id", () => {
  describe("When valid patient ID is given in URL", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .delete("/patient/63f01efe3b5704fa0aa3ddc2")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe(
        "Deleted patient 63f01efe3b5704fa0aa3ddc2"
      );
      expect(response.statusCode).toBe(200);
    });
  });

  describe("When invalid patient ID is given in URL", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .delete("/patient/63f01efe3b5704fa0aa3ddc5")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("Patient not found");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When valid patient ID is given, but user is not coordinator", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .delete("/patient/63f01f0a3b5704fa0aa3ddc3")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Invite Carer----------//
describe("POST /carer/invite/:id", () => {
  describe("When a valid carer email/id is provided", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .post("/carer/invite/63f01efe3b5704fa0aa3ddc4")
        .set("Cookie", cookie)
        .send({
          email: "frank@example.com",
        });
      expect(response.body.message).toBe("Email Sent");
      expect(response.statusCode).toBe(200);
    });
  });

  describe("When a valid carer email is provided but invalid id is provided", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .post("/carer/invite/63f1a4d11f2991daee0c83a2")
        .set("Cookie", cookie)
        .send({
          email: "frank@example.com",
        });
      expect(response.body.message).toBe("Patient not found");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When an invalid carer email is provided but valid patient id is provided", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .post("/carer/invite/63f01efe3b5704fa0aa3ddc4")
        .set("Cookie", cookie)
        .send({
          email: "fakeemail@example.com",
        });
      expect(response.body.message).toBe("Carer has not made an account yet");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When user does not have coordinator privileges", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .post("/carer/invite/63f01f0a3b5704fa0aa3ddc5")
        .set("Cookie", cookie)
        .send({
          email: "frank@example.com",
        });
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Add Carer----------//
describe("POST /carer/add/:token", () => {
  describe("When a valid addition token is provided", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .post(
          "/carer/add/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYXJlcklEIjoiNjNmMGI5NWEwMDk4ZTI4ZDU4ZjdhMmQxIiwicGF0aWVudElEIjoiNjNmMDFlZmUzYjU3MDRmYTBhYTNkZGM0IiwiaWF0IjoxNjc2NzgzMDI2LCJleHAiOjE2NzkzNzUwMjZ9.4aHTxtrEiPk62PqF75G8OnNMDCGvHmPMKgVCXW04bqA"
        )
        .send({});
      expect(response.body.carers).toContain("63f0b95a0098e28d58f7a2d1");
      expect(response.statusCode).toBe(200);
    });
  });

  describe("Try adding the same carer twice", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .post(
          "/carer/add/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYXJlcklEIjoiNjNmMGI5NWEwMDk4ZTI4ZDU4ZjdhMmQxIiwicGF0aWVudElEIjoiNjNmMDFlZmUzYjU3MDRmYTBhYTNkZGM0IiwiaWF0IjoxNjc2NzgzMDI2LCJleHAiOjE2NzkzNzUwMjZ9.4aHTxtrEiPk62PqF75G8OnNMDCGvHmPMKgVCXW04bqA"
        )
        .send({});
      expect(response.body.message).toBe("Carer already exists");
      expect(response.statusCode).toBe(400);
    });
  });
  describe("When carer does not have account yet", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .post(
          "/carer/add/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYXJlcklEIjoiNjNmMGI5NWEwMDk4ZTI4ZDU4ZjdhMmQzIiwicGF0aWVudElEIjoiNjNmMDFlZmUzYjU3MDRmYTBhYTNkZGM0IiwiaWF0IjoxNjc3MzM0MDk0LCJleHAiOjE2Nzk5MjYwOTR9.MGfr86okT7CfxIPTizaV91U0wzT0b8VcCxBXNg3fCq0"
        )
        .send({});
      expect(response.body.message).toBe("Carer has not made an account yet");
      expect(response.statusCode).toBe(400);
    });
  });
});

//---------Remove Carer----------//
describe("DELETE carer/remove/:patientID/:carerID", () => {
  describe("When a valid patient and carerID is provided", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .delete(
          "/carer/remove/63f01efe3b5704fa0aa3ddc4/63f0b95a0098e28d58f7a2d1"
        )
        .set("Cookie", cookie)
        .send({});
      expect(response.body.carers).toHaveLength(0);
      expect(response.statusCode).toBe(200);
    });
  });

  describe("When an invalid patient and valid carerID is provided", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .delete(
          "/carer/remove/63f01efe3b5704fa0aa3ddc5/63f0b95a0098e28d58f7a2d1"
        )
        .set("Cookie", cookie)
        .send({});
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When a valid patient and invalid carerID is provided", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .delete(
          "/carer/remove/63f01efe3b5704fa0aa3ddc4/63f0b95a0098e28d58f7a2d9"
        )
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("Carer does not exist");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("When the user does not have coordinator privileges", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .delete(
          "/carer/remove/63f01f0a3b5704fa0aa3ddc3/63f0b95a0098e28d58f7a25e"
        )
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Get User Shifts----------//
describe("GET /shift", () => {
  describe("When user is logged in", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .get("/shift")
        .set("Cookie", cookie)
        .send({});
      expect(response.statusCode).toBe(200);
    });
  });
});

//---------Get Patient Shifts----------//
describe("GET /shift/:patientID", () => {
  describe("When the user is associated with the patient", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .get("/shift/63f01efe3b5704fa0aa3ddc4")
        .set("Cookie", cookie)
        .send({});
      expect(response.statusCode).toBe(200);
    });
  });
  describe("When the user isn't associated with the patient", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .get("/shift/63f01f0a3b5704fa0aa3ddc3")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
  describe("When the patient doesn't exist", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .get("/shift/63f01f0a3b5704fa0aa3ddc7")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("Patient not found");
      expect(response.statusCode).toBe(400);
    });
  });
});

//---------Create Shifts----------//
describe("POST /shift/:patientID", () => {
  describe("When the coordinator creates a shift for the patient", () => {
    test("Should respond with 201 status", async () => {
      const response = await request(app)
        .post("/shift/63f01efe3b5704fa0aa3ddc8")
        .set("Cookie", cookie)
        .send({
          carerID: "63f0b95a0098e28d58f7a2d5",
          shiftStartTime: "2023-03-02T09:00:00.000+00:00",
          shiftEndTime: "2023-03-02T12:00:00.000+00:00",
          coordinatorNotes:
            "Please take notes on erratic behaviors for the psychologist",
        });
      expect(response.body.patient).toBe("63f01efe3b5704fa0aa3ddc8");
      expect(response.body.coordinator).toBe("63f0b95a0098e28d58f7a25d");
      expect(response.body.carer).toBe("63f0b95a0098e28d58f7a2d5");
      expect(response.body.coordinatorNotes).toBe(
        "Please take notes on erratic behaviors for the psychologist"
      );
      expect(response.body.shiftStartTime).toBe(
        "2023-03-02T09:00:00.000+00:00"
      );
      expect(response.body.shiftEndTime).toBe("2023-03-02T12:00:00.000+00:00");
      expect(response.statusCode).toBe(201);
    });
  });
  describe("When the patient does not exist", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .post("/shift/63f01efe3b5704fa0aa3ddc6")
        .set("Cookie", cookie)
        .send({
          carerID: "63f0b95a0098e28d58f7a2d5",
          shiftStartTime: "2023-03-02T09:00:00.000+00:00",
          shiftEndTime: "2023-03-02T12:00:00.000+00:00",
          coordinatorNotes:
            "Please take notes on erratic behaviors for the psychologist",
        });
      expect(response.body.message).toBe("Patient not found");
      expect(response.statusCode).toBe(400);
    });
  });
  describe("When the user is not the coordinator for the patient", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .post("/shift/63f01f0a3b5704fa0aa3ddc5")
        .set("Cookie", cookie)
        .send({
          carerID: "63f0b95a0098e28d58f7a2d5",
          shiftStartTime: "2023-03-02T09:00:00.000+00:00",
          shiftEndTime: "2023-03-02T12:00:00.000+00:00",
          coordinatorNotes:
            "Please take notes on erratic behaviors for the psychologist",
        });
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Update Shift----------//
describe("POST /shift/:shiftID", () => {
  describe("When the coordinator updates a shift for the patient", () => {
    test("Should respond with 201 status", async () => {
      const response = await request(app)
        .put("/shift/63f01f0a3b5704fa0aa3ddc9")
        .set("Cookie", cookie)
        .send({
          shiftStartTime: "2023-03-02T10:00:00.000+00:00",
          shiftEndTime: "2023-03-02T13:00:00.000+00:00",
          coordinatorNotes: "New coordinator notes",
        });
      expect(response.body.coordinatorNotes).toBe("New coordinator notes");
      expect(response.body.shiftStartTime).toBe("2023-03-02T10:00:00.000Z");
      expect(response.body.shiftEndTime).toBe("2023-03-02T13:00:00.000Z");
      expect(response.statusCode).toBe(201);
    });
  });
  describe("When the user is not the coordinator for the patient", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .put("/shift/63f01f0a3b5704fa0aa3ddd8")
        .set("Cookie", cookie)
        .send({
          shiftStartTime: "2023-03-02T09:00:00.000+00:00",
          shiftEndTime: "2023-03-02T12:00:00.000+00:00",
          coordinatorNotes:
            "Please take notes on erratic behaviors for the psychologist",
        });
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Delete Shift----------//
describe("POST /shift/:shiftID", () => {
  describe("When the coordinator updates deletes a shift", () => {
    test("Should respond with 201 status", async () => {
      const response = await request(app)
        .delete("/shift/63f01f0a3b5704fa0aa3ddc9")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe(
        "Deleted shift 63f01f0a3b5704fa0aa3ddc9"
      );
      expect(response.statusCode).toBe(200);
    });
  });
  describe("When the user deletes the shift without proper auth", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .delete("/shift/63f01f0a3b5704fa0aa3ddd8")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Create Shift Notes----------//
describe("POST /notes/:shiftID", () => {
  describe("When the carer creates shift notes", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .post("/shift/notes/63f01f0a3b5704fa0aa3ddc6")
        .set("Cookie", cookie)
        .send({
          shiftNotes:
            "These are new shift notes that will be turned in to a pdf for cloudinary to handle",
        });
      expect(response.body).toHaveProperty("shiftNotes");
      expect(response.statusCode).toBe(200);
    });
  });

  describe("When the carer does not enter shift notes", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .post("/shift/notes/63f01f0a3b5704fa0aa3ddc6")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("Please fill out all fields");
      expect(response.statusCode).toBe(400);
    });
  });
  describe("When shift notes are entered by someone who is not the carer", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .post("/shift/notes/63f01f0a3b5704fa0aa3ddc8")
        .set("Cookie", cookie)
        .send({
          shiftNotes:
            "These are new shift notes that will be turned in to a pdf for cloudinary to handle",
        });
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});

//---------Create Incident report----------//
describe("POST /reports/:shiftID", () => {
  describe("When the carer creates shift notes", () => {
    test("Should respond with 200 status", async () => {
      const response = await request(app)
        .post("/shift/reports/63f01f0a3b5704fa0aa3ddc6")
        .set("Cookie", cookie)
        .send({
          incidentReport:
            "This is a new incident report that will be turned in to a pdf for cloudinary to handle",
        });
      expect(response.body).toHaveProperty("incidentReports");
      expect(response.statusCode).toBe(200);
    });
  });
  describe("When the carer does not enter shift notes", () => {
    test("Should respond with 400 status", async () => {
      const response = await request(app)
        .post("/shift/reports/63f01f0a3b5704fa0aa3ddc6")
        .set("Cookie", cookie)
        .send({});
      expect(response.body.message).toBe("Please fill out all fields");
      expect(response.statusCode).toBe(400);
    });
  });
  describe("When shift notes are entered by someone who is not the carer", () => {
    test("Should respond with 401 status", async () => {
      const response = await request(app)
        .post("/shift/reports/63f01f0a3b5704fa0aa3ddc8")
        .set("Cookie", cookie)
        .send({
          incidentReport:
            "This is a new incident report that will be turned in to a pdf for cloudinary to handle",
        });
      expect(response.body.message).toBe("User is not authorized");
      expect(response.statusCode).toBe(401);
    });
  });
});