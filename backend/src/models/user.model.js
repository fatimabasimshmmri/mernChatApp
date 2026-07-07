import mongoose from "mongoose" //require mongoose


const userSchema = new mongoose.Schema( //create a user schema
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
        },
        email:{
             type: String,
             required: true,
             unique: true,
             lowercase: true,
        },
        fullName:{
            type: String,
            required: true,
        },
        profilePic:{
            type: String,
            default: "",
        },
    },
     
    {
        timestamps: true
    },
)

const User = mongoose.model("User",userSchema) //export it
export default User