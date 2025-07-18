import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  partnerCode: string;
  password: string;
}

const UserSchema = new Schema<IUser>({
  partnerCode: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
