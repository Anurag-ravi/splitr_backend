import mongoose, { Document, Schema } from 'mongoose';

export interface IUser {
    name: string;
    country_code: string;
    email: string;
    phone: string;
    upi_id: string;
    verified: boolean;
}

export interface IUserModel extends IUser, Document {}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        country_code: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true, unique: true },
        upi_id: { type: String, unique: true },
        verified: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model<IUserModel>('User', UserSchema);
