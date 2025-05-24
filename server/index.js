require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;
const app = express();
// middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://fitness-tracker49.web.app",
    "https://fitness-tracker49.firebaseapp.com",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@cluster0.tqv0m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const db = client.db("FitnessTracker");
    const usersCollection = db.collection("users");
    const trainersCollection = db.collection("trainers");
    const classesCollection = db.collection("classes");
    const slotsCollection = db.collection("slots");
    const postsCollection = db.collection("postsForum");
    const paymentsCollection = db.collection("payments");
    const Reviews = db.collection("reviews");

    // Generate jwt token
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Send token in response instead of setting cookie
    // app.post("/jwt", async (req, res) => {
    //   try {
    //     const email = req.body;

    //     // Generate JWT token
    //     const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
    //       expiresIn: "1d",
    //     });

    //     // Send token in response instead of setting cookie
    //     res.status(200).json({
    //       success: true,
    //       token: token  // Client will store this in localStorage
    //     });
    //   } catch (error) {
    //     console.error('Error generating token:', error);
    //     res.status(500).json({
    //       success: false,
    //       message: 'Failed to generate token'
    //     });
    //   }
    // });

    // Logout
    app.get("/logout", async (req, res) => {
      try {
        res
          .clearCookie("token", {
            maxAge: 0,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
      } catch (err) {
        res.status(500).send(err);
      }
    });

    // All APIs Routes starts here>>>>>>>>>

    // Add user to the database
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // User exists checking by email 
    app.get("/users/exist/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const user = await usersCollection.findOne({ email });
        res.json({ exists: !!user });
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Add trainer to the database
    app.post("/trainers", async (req, res) => {
      try {
        const trainer = req.body;
        const result = await trainersCollection.insertOne(trainer);
        res.status(201).json({ success: true, result });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, error: "Failed to save trainer data." });
      }
    });

    // Get all Un-approved trainers
    app.get("/trainers", async (req, res) => {
      try {
        const trainers = await trainersCollection
          .find({ status: "pending" })
          .toArray();
        res.status(200).json({ success: true, trainers });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, error: "Failed to fetch trainers data." });
      }
    });

    // Get specific Un-approved trainers by Email
    app.get("/trainersByEmail/:email", async (req, res) => {
      try {
        const { email } = req.params;

        // Find a trainer with the specific email and pending status
        const trainer = await trainersCollection.findOne({
          email: email,
          // status: "pending",
        });

        if (!trainer) {
          return res.status(404).json({
            success: false,
            message: "No unapproved trainer found with this email",
          });
        }

        res.status(200).json({
          success: true,
          trainer,
        });
      } catch (error) {
        console.error("Error fetching unapproved trainer by email:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch trainer data.",
        });
      }
    });

    // Get all approved trainers
    app.get("/approvedTrainers", async (req, res) => {
      try {
        const approvedTrainersCollection = db.collection("approvedTrainers");
        const approvedTrainers = await approvedTrainersCollection
          .find()
          .toArray();
        res.status(200).json({ success: true, trainers: approvedTrainers });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Failed to fetch approved trainers data.",
        });
      }
    });

    // Get specific approved trainers by Email --- Noted Fixed ✅
    app.get("/approvedTrainer/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const approvedTrainersCollection = db.collection("approvedTrainers");
        const trainer = await approvedTrainersCollection.findOne({ email });

        if (!trainer) {
          return res.json({
            success: false,
            message: "No trainer found with this email",
          });
        }

        res.json({
          success: true,
          trainer,
        });
      } catch (error) {
        console.error("Error fetching approved trainer:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch approved trainer data",
        });
      }
    });

    // Update trainer status (e.g., from Trainer to user)
    app.patch("/trainer/:id", async (req, res) => {
      try {
        const trainerId = req.params.id;
        const { status } = req.body;

        // Get the trainer details
        const approvedTrainersCollection = db.collection("approvedTrainers");
        const trainer = await approvedTrainersCollection.findOne({
          _id: new ObjectId(trainerId),
        });

        if (!trainer) {
          return res.status(404).json({
            success: false,
            message: "Trainer not found",
          });
        }

        // Update user role in users collection
        const userUpdate = await usersCollection.updateOne(
          { email: trainer.email },
          { $set: { role: "user" } }
        );

        // Remove from approvedTrainers collection
        const deleteResult = await approvedTrainersCollection.deleteOne({
          _id: new ObjectId(trainerId),
        });

        if (!userUpdate.acknowledged || !deleteResult.acknowledged) {
          throw new Error("Failed to update user status");
        }

        res.json({
          success: true,
          message: "Trainer status updated successfully",
        });
      } catch (error) {
        console.error("Error updating trainer status:", error);
        res.status(500).json({
          success: false,
          error: error.message || "Failed to update trainer status",
        });
      }
    });

    // Get a specific approved trainer by ID --- Noted Fixed ✅
    app.get("/approvedTrainers/:id", async (req, res) => {
      try {
        const trainerId = req.params.id;
        const approvedTrainersCollection = db.collection("approvedTrainers");
        const approvedTrainer = await approvedTrainersCollection.findOne({
          _id: new ObjectId(trainerId),
        });
        res.json({
          success: true,
          trainer: approvedTrainer,
        });
      } catch (error) {
        console.error("Error fetching approved trainer:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch approved trainer data",
        });
      }
    });

    // Get all users (subscribers)
    app.get("/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.status(200).json({ success: true, users });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, error: "Failed to fetch users." });
      }
    });

    // Get all users by role (e.g., user, trainer)
    app.get("/users/role/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const user = await usersCollection.findOne({ email });
        res.status(200).json({
          success: true,
          role: user?.role || "user",
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Failed to fetch user role.",
        });
      }
    });

    // Get a specific Un-approved trainer by ID
    app.get("/trainers/:id", async (req, res) => {
      //❌
      try {
        const trainerId = req.params.id;
        const trainer = await trainersCollection.findOne({
          _id: new ObjectId(trainerId),
        });
        res.json({
          success: true,
          trainer,
        });
      } catch (error) {
        res.json({
          success: false,
          error: "Failed to fetch trainer data",
        });
      }
    });

    // Add a new class to the database by Admin
    app.post("/classes", async (req, res) => {
      try {
        const { className, details, additionalInfo, image } = req.body;
        const result = await classesCollection.insertOne({
          className,
          details,
          additionalInfo: additionalInfo || "",
          image: image || null,
          createdAt: new Date(),
        });

        res.json({
          success: true,
          message: "Class added successfully!",
          result,
        });
      } catch (error) {
        res.json({ success: false, error: "Failed to save class data." });
      }
    });

    // patch request to update class with trainer data
    app.patch("/classes/:classId", async (req, res) => {
      try {
        const { classId } = req.params;
        const updatedClassData = req.body;

        // Validate that required fields are present
        if (!updatedClassData.className || !updatedClassData.trainer) {
          return res.json({
            success: false,
            error: "Missing required fields",
          });
        }

        const result = await classesCollection.updateOne(
          { _id: new ObjectId(classId) },
          {
            $set: {
              // Preserve existing class fields
              className: updatedClassData.className,
              details: updatedClassData.details,
              additionalInfo: updatedClassData.additionalInfo,
              image: updatedClassData.image,
              // Add trainer data
              // trainer: updatedClassData.trainer,

              trainerAssignedAt: updatedClassData.trainerAssignedAt,
              // Add last updated timestamp
              lastUpdated: new Date(),
            },
            $addToSet: {
              trainer: [updatedClassData.trainer],
            },
          }
        );

        if (result.matchedCount === 0) {
          return res.json({
            success: false,
            error: "Class not found.",
          });
        }

        res.json({
          success: true,
          message: "Class updated successfully with trainer data!",
          result,
        });
      } catch (error) {
        console.error("Server error:", error);
        res.json({
          success: false,
          error: "Failed to update class with trainer data.",
        });
      }
    });

    // Get all classes from the database with Pagination
    app.get("/classes", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        const [classes, totalCount] = await Promise.all([
          classesCollection.find().skip(skip).limit(limit).toArray(),
          classesCollection.countDocuments(),
        ]);

        res.json({
          success: true,
          classes,
          total: totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
        });
      } catch (error) {
        res.json({
          success: false,
          error: "Failed to retrieve classes.",
        });
      }
    });

    // Endpoint for getting all classes without pagination
    app.get("/allClasses", async (req, res) => {
      try {
        const classes = await classesCollection.find().toArray();

        res.json({
          success: true,
          classes,
          total: classes.length,
        });
      } catch (error) {
        console.error("Error fetching all classes:", error);
        res.json({
          success: false,
          error: "Failed to retrieve classes.",
        });
      }
    });

    // implement a search feature for the classes
    app.get("/classes/search", async (req, res) => {
      try {
        const searchQuery = req.query.query || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        // Create a case-insensitive regex search query
        const searchRegex = new RegExp(searchQuery, "i");

        const [classes, totalCount] = await Promise.all([
          classesCollection
            .find({ className: searchRegex })
            .skip(skip)
            .limit(limit)
            .toArray(),
          classesCollection.countDocuments({ className: searchRegex }),
        ]);

        res.json({
          success: true,
          classes,
          total: totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
        });
      } catch (error) {
        res.json({
          success: false,
          error: "Failed to search classes.",
        });
      }
    });

    // Get all classes from the database to show top six most booked classes
    app.get("/featured-classes", async (req, res) => {
      try {
        const featuredClasses = await classesCollection
          .find({})
          .sort({ bookingCount: -1 })
          .limit(6)
          .toArray();

        res.json({
          success: true,
          featuredClasses,
        });
      } catch (error) {
        res.json({
          success: false,
          error: "Failed to retrieve featured classes.",
        });
      }
    });

    // Increment Booking Count in class
    app.patch("/incrementClasses/:classId", async (req, res) => {
      try {
        const result = await classesCollection.updateOne(
          { _id: new ObjectId(req.params.classId) },
          { $inc: { bookingCount: 1 } } // Increment by 1
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Add a new slot to the database
    app.post("/slots", async (req, res) => {
      try {
        // Validate that we have a database connection
        if (!slotsCollection) {
          throw new Error("Database not initialized");
        }

        console.log("Received slot data:", req.body);

        const result = await slotsCollection.insertOne(req.body);
        console.log("MongoDB result:", result);

        res.json({
          success: true,
          message: "Slot created successfully!",
          slotId: result.insertedId,
        });
      } catch (error) {
        console.error("MongoDB error:", error);
        res.status(500).json({
          success: false,
          message: "Error creating slot.",
          error: error.message,
        });
      }
    });

    // Delete a slot by slotId
    app.delete("/slots/:id", async (req, res) => {
      try {
        if (!slotsCollection) throw new Error("Database not initialized");

        const result = await slotsCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Slot not found" });
        }

        res.json({ success: true, message: "Slot deleted successfully" });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error deleting slot",
          error: error.message,
        });
      }
    });

    // Get all slots
    app.get("/slots", async (req, res) => {
      try {
        const slots = await slotsCollection.find().toArray();

        res.json({
          success: true,
          slots,
        });
      } catch (error) {
        console.error("MongoDB error:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching slots.",
          error: error.message,
        });
      }
    });

    // Get all slots from the database by ID
    app.get("/slots/byTrainer/:trainerId", async (req, res) => {
      try {
        const { trainerId } = req.params;
        const slot = await slotsCollection.findOne({ trainerId: trainerId });

        if (!slot) {
          return res.status(404).json({
            success: false,
            message:
              "No slots available for this trainer. Please check back later or contact support.",
          });
        }

        res.json({ success: true, slot });
      } catch (error) {
        console.error("Error fetching slot:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching slot",
          error: error.message,
        });
      }
    });

    // Get all slots from the database by Email
    app.get("/slots/byEmail/:email", async (req, res) => {
      try {
        const { email } = req.params;

        // Query to find all slots associated with the given email
        const slots = await slotsCollection
          .find({ trainerEmail: email })
          .toArray();

        // If no slots are found
        if (!slots || slots.length === 0) {
          return res.status(404).json({
            success: false,
            message: "No slots found for this email",
          });
        }

        // Respond with the slots
        res.json({
          success: true,
          slots,
        });
      } catch (error) {
        console.error("Error fetching slots:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching slots",
          error: error.message,
        });
      }
    });

    // Update a slot in the database with user Email and name

    app.patch("/api/slots/:trainerId", async (req, res) => {
      try {
        const { trainerId } = req.params;
        const { customerInfo } = req.body;

        // Find the slot document using slotsCollection
        const slot = await slotsCollection.findOne({ trainerId: trainerId });

        if (!slot) {
          return res.status(404).json({
            success: false,
            message: "Slot not found",
          });
        }

        // Check if customers array exists, if not, create it
        if (!slot.customers) {
          slot.customers = [];
        }

        // Add the new customer info
        slot.customers.push(customerInfo);

        // Update the slot document in the database
        const updatedSlot = await slotsCollection.updateOne(
          { trainerId: trainerId },
          { $set: { customers: slot.customers } }
        );

        res.status(200).json({
          success: true,
          data: updatedSlot,
        });
      } catch (error) {
        console.error("Slot update error:", error);
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    // Confirm trainer application
    app.patch("/trainers/:id/confirm", async (req, res) => {
      try {
        const trainerId = req.params.id;

        // Get the trainer's details
        const trainer = await trainersCollection.findOne({
          _id: new ObjectId(trainerId),
        });

        if (!trainer) {
          return res.status(404).json({
            success: false,
            message: "Trainer not found",
          });
        }

        // First, create the approved trainer document
        const approvedTrainersCollection = db.collection("approvedTrainers");
        const approvedTrainer = {
          ...trainer,
          _id: new ObjectId(), // Create new ID for approved trainer
          originalApplicationId: trainer._id,
          approvedAt: new Date(),
          status: "Trainer",
        };

        // Insert into approvedTrainers collection
        const insertResult = await approvedTrainersCollection.insertOne(
          approvedTrainer
        );

        if (!insertResult.acknowledged) {
          throw new Error("Failed to insert into approvedTrainers collection");
        }

        // Update user role
        const userUpdate = await usersCollection.updateOne(
          { email: trainer.email },
          { $set: { role: "trainer" } }
        );

        if (!userUpdate.acknowledged) {
          // Rollback the approved trainer insert if user update fails
          await approvedTrainersCollection.deleteOne({
            _id: approvedTrainer._id,
          });
          throw new Error("Failed to update user role");
        }

        // Update trainer status instead of deleting
        const updateResult = await trainersCollection.updateOne(
          { _id: new ObjectId(trainerId) },
          {
            $set: {
              status: "trainer",
              approvedAt: new Date(),
              approvedTrainerId: approvedTrainer._id, // Reference to the approved trainer document
            },
          }
        );

        if (!updateResult.acknowledged) {
          // Rollback previous operations if update fails
          await approvedTrainersCollection.deleteOne({
            _id: approvedTrainer._id,
          });
          await usersCollection.updateOne(
            { email: trainer.email },
            { $set: { role: "user" } }
          );
          throw new Error("Failed to update trainer status");
        }

        res.json({
          success: true,
          message: "Trainer application confirmed successfully",
          trainer: approvedTrainer,
        });
      } catch (error) {
        console.error("Error in trainer confirmation:", error);
        res.status(500).json({
          success: false,
          error: error.message || "Failed to confirm trainer application",
        });
      }
    });

    // Reject trainer application
    app.patch("/trainers/:id/reject", async (req, res) => {
      try {
        const trainerId = req.params.id;
        const { feedback } = req.body;

        // Get the trainer details
        const trainer = await trainersCollection.findOne({
          _id: new ObjectId(trainerId),
        });

        if (!trainer) {
          return res.status(404).json({
            success: false,
            message: "Trainer not found",
          });
        }

        // Store rejection feedback in rejectedTrainers collection
        const rejectedTrainersCollection = db.collection("rejectedTrainers");
        await rejectedTrainersCollection.insertOne({
          trainerId: trainer._id,
          trainerEmail: trainer.email,
          feedback,
          rejectedAt: new Date(),
        });

        // Update trainer status instead of deleting
        await trainersCollection.updateOne(
          { _id: new ObjectId(trainerId) },
          {
            $set: {
              status: "rejected",
              rejectionFeedback: feedback,
              rejectedAt: new Date(),
            },
          }
        );

        res.json({
          success: true,
          message: "Trainer application rejected successfully",
        });
      } catch (error) {
        console.error("Error rejecting trainer:", error);
        res.status(500).json({
          success: false,
          error: "Failed to reject trainer application",
        });
      }
    });
    // -----------------------------------------------------
    // Create a new forum post
    app.post("/postsForum", async (req, res) => {
      try {
        const { title, content, category, author, email, role, timestamp } =
          req.body;

        const newPost = {
          title,
          content,
          category,
          author,
          email, // email field
          role, // role field
          timestamp,
        };

        const result = await postsCollection.insertOne(newPost);

        if (result.acknowledged) {
          res.status(201).json({
            success: true,
            message: "Post created!",
            postId: result.insertedId,
          });
        } else {
          throw new Error("Post creation failed");
        }
      } catch (error) {
        console.error("Error creating forum post:", error);
        res.status(500).json({
          success: false,
          error: "Error creating post.",
        });
      }
    });

    // Get paginated forum posts
    app.get("/postsForum", async (req, res) => {
      try {
        const { page = 1, limit = 6 } = req.query;

        const skip = (page - 1) * limit;
        const posts = await postsCollection
          .find()
          .skip(skip)
          .limit(parseInt(limit))
          .toArray();

        const totalPosts = await postsCollection.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
          posts,
          totalPosts,
          totalPages,
          currentPage: parseInt(page),
        });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, error: "Failed to fetch posts." });
      }
    });

    // Get latest forum posts
    app.get("/latestPostsForum", async (req, res) => {
      try {
        const { limit = 6 } = req.query; // Default limit is 6 posts

        const posts = await postsCollection
          .find()
          .sort({ createdAt: -1 }) // Sort by most recent
          .limit(parseInt(limit))
          .toArray();

        res.status(200).json({ posts });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, error: "Failed to fetch latest posts." });
      }
    });
    // Get specific forum post by ID
    app.get("/forum/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const post = await postsCollection.findOne({ _id: new ObjectId(id) });

        if (!post) {
          return res
            .status(404)
            .json({ success: false, message: "Post not found." });
        }

        res.status(200).json({ success: true, post });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, error: "Failed to fetch post." });
      }
    });
    // Vote on a forum post
    // PATCH route to handle post voting
    app.patch("/postsForum/:postId/vote", async (req, res) => {
      try {
        const { postId } = req.params;
        const { voteType } = req.body;

        const updateField = voteType === "upvote" ? "upvotes" : "downvotes";
        await postsCollection.updateOne(
          { _id: new ObjectId(postId) },
          { $inc: { [updateField]: 1 } }
        );

        const updatedPost = await postsCollection.findOne({
          _id: new ObjectId(postId),
        });
        res.json({
          message: "Vote recorded",
          upvotes: updatedPost?.upvotes || 0,
          downvotes: updatedPost?.downvotes || 0,
        });
      } catch {
        res.status(500).json({ error: "Server error" });
      }
    });

    // ✅✅✅✅

    // In your trainer routes file
    app.patch("/approvedTrainer/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const { selectedClass } = req.body;

        const result = await trainerCollection.updateOne(
          { email: email },
          {
            $set: {
              selectedClass: selectedClass,
            },
          }
        );

        if (result.modifiedCount > 0) {
          res.json({
            success: true,
            message: "Trainer class selection updated successfully",
          });
        } else {
          res.json({
            success: false,
            message: "No trainer found or no changes made",
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error updating trainer class selection",
          error: error.message,
        });
      }
    });

    // 🎇🎇🎇🎇🎇🎇🎇🎇🎇🎇🎇🎇🎇🎇🎇
    // Create payment intent
    // Create payment intent endpoint that matches frontend URL
    // Update the create-payment-intent endpoint
    app.post("/api/create-payment-intent", async (req, res) => {
      try {
        const { price } = req.body;

        // Validate price
        if (!price || isNaN(price) || price <= 0) {
          return res.status(400).json({
            error: "Invalid price amount",
          });
        }

        // Convert price to cents
        const amount = Math.round(price * 100);

        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          payment_method_types: ["card"],
          // Optional: Add metadata if needed
          metadata: {
            integration_check: "accept_a_payment",
          },
        });

        console.log("PaymentIntent Created:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          clientSecret: paymentIntent.client_secret ? "present" : "missing",
        });

        if (!paymentIntent.client_secret) {
          throw new Error("No client secret received from Stripe");
        }

        // Send the client secret to the frontend
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Payment Intent Error:", error);
        res.status(500).json({
          error: "Failed to create payment intent",
          details: error.message,
        });
      }
    });

    // Save payment information after successful payment
    app.post("/api/save-payment", async (req, res) => {
      try {
        const {
          // Basic payment info
          paymentId,
          trainerName,
          slotName,
          packageName,
          price,
          userName,
          userEmail,
          status,
          createdAt,

          // Additional trainer and class info
          trainerId,
          trainerEmail,
          trainerProfile,
          classId,
          className,
          classImage,
          classDetails,
          classAdditionalInfo,
          date,
          startTime,
          maxParticipants,
          membershipType,
          specialInstructions,
          membershipFeatures,
          slotStatus,
        } = req.body;

        const paymentInfo = {
          transactionId: paymentId,
          trainerName,
          slotName,
          packageName,
          price,
          userName,
          userEmail,
          status,
          createdAt: new Date(createdAt),
          paidAt: new Date(),

          // Adding all additional info
          trainerId,
          trainerEmail,
          trainerProfile,
          classId,
          className,
          classImage,
          classDetails,
          classAdditionalInfo,
          date,
          startTime,
          maxParticipants,
          membershipType,
          specialInstructions,
          membershipFeatures,
          slotStatus,
        };

        const result = await paymentsCollection.insertOne(paymentInfo);

        if (result.acknowledged) {
          res.status(200).send({ success: true });
        } else {
          throw new Error("Failed to save payment information");
        }
      } catch (error) {
        console.log("Save Payment Error:", error);
        res.status(500).send({ error: error.message });
      }
    });

    app.get("/payment-history/:email", async (req, res) => {
      try {
        const email = req.params.email;
        console.log("Received email:", email); // Log email to verify it's being received
        const result = await paymentsCollection
          .find({ userEmail: email })
          .sort({ paidAt: -1 })
          .toArray();

        if (result.length === 0) {
          return res
            .status(404)
            .send({ error: "No payment history found for this email." });
        }

        res.json(result); // Send response as JSON
      } catch (error) {
        console.error("Error fetching payment history:", error);
        res.status(500).send({ error: error.message });
      }
    });

    // Get all payments (admin only)
    app.get("/all-payments", async (req, res) => {
      try {
        const result = await paymentsCollection
          .find()
          .sort({ paidAt: -1 })
          .toArray();

        if (!Array.isArray(result)) {
          return res.status(500).send({ error: "Unexpected data format" });
        }

        res.json(result); // Ensure JSON format
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // POST endpoint to create a new review
    app.post("/reviews", async (req, res) => {
      try {
        const {
          trainerId,
          userId,
          userEmail,
          userName,
          rating,
          review,
          trainerName,
        } = req.body;

        // Validate required fields
        if (!trainerId || !userEmail || !rating || !review) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields",
          });
        }

        // Validate rating is between 1 and 5
        if (rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            error: "Rating must be between 1 and 5",
          });
        }

        // Check if user has already reviewed this trainer
        const existingReview = await Reviews.findOne({
          trainerId,
          userEmail,
        });

        if (existingReview) {
          return res.status(400).json({
            success: false,
            error: "You have already reviewed this trainer",
          });
        }

        // Create new review document
        const newReview = {
          trainerId,
          userId,
          userEmail,
          userName,
          rating: Number(rating),
          review,
          trainerName,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active", // You can use this to moderate reviews if needed
        };

        const result = await Reviews.insertOne(newReview);

        // If review is successfully inserted
        if (result.acknowledged) {
          // Calculate new average rating for trainer
          const trainerReviews = await Reviews.find({ trainerId }).toArray();
          const averageRating =
            trainerReviews.reduce((acc, curr) => acc + curr.rating, 0) /
            trainerReviews.length;
          res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: {
              reviewId: result.insertedId,
              averageRating,
            },
          });
        } else {
          throw new Error("Failed to insert review");
        }
      } catch (error) {
        console.error("Error in /reviews POST:", error);
        res.status(500).json({
          success: false,
          error: "Failed to submit review",
        });
      }
    });

    // Get all active reviews
    // Fetch active reviews from the "reviews" collection
    app.get("/reviews", async (req, res) => {
      try {
        // Explicitly use the "Reviews" collection
        const reviews = await Reviews.find({ status: "active" })
          .sort({ createdAt: -1 })
          .toArray();

        if (!reviews.length) {
          return res
            .status(404)
            .json({ success: false, message: "No reviews found." });
        }

        res.status(200).json({ success: true, reviews });
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res
          .status(500)
          .json({ success: false, error: "Failed to fetch reviews." });
      }
    });

    // ----------------------------------
    // Subscription API Endpoint
    app.post("/api/subscribe", async (req, res) => {
      const { name, email } = req.body;
      if (!name || !email)
        return res
          .status(400)
          .json({ message: "Name and email are required." });

      try {
        const collection = db.collection("subscribers");
        const isSubscribed = await collection.findOne({ email });
        if (isSubscribed)
          return res.status(400).json({ message: "Already subscribed." });

        await collection.insertOne({ name, email, subscribedAt: new Date() });
        res.status(200).json({ message: "Subscription successful!" });
      } catch {
        res.status(500).json({ message: "Internal server error." });
      }
    });

    // ---------------------------------------------------------
    // All APIs Routes ends here>>>>>>>>>>
  } finally {
    // You can optionally close the client connection here if needed
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Battle For supremacy");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});