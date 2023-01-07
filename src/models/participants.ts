import mongoose, { Document, Schema } from 'mongoose';

export interface IParticipant {
    trip: string;
    user: string;
    name: string;
    paid: number;
    owed: number;
    is_settled: boolean;
}

export interface IParticipantModel extends IParticipant, Document {}

const ParticipantSchema: Schema = new Schema(
    {
        trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String },
        paid: { type: Number, default: 0 },
        owed: { type: Number, default: 0 },
        is_settled: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model<IParticipantModel>('Participant', ParticipantSchema);
