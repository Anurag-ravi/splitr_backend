import mongoose, { Document, Schema } from 'mongoose';

export interface ITrip {
    code: string;
    name: string;
    description: string;
    currency: string;
    creator: string;
    participants: string[];
    expenses: string[];
    payments: string[]; // TODO: Add payments
}

export interface ITripModel extends ITrip, Document {}

const TripSchema: Schema = new Schema(
    {
        code: { type: String, unique: true, required: true },
        name: { type: String, required: true },
        description: { type: String, default: '' },
        currency: { type: String, default: 'INR' },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participants' }],
        expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
        payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }]
    },
    {
        timestamps: true,
        versionKey: false
    }
);

TripSchema.post('deleteOne', async function (doc) {
    const { participants, expenses, payments } = doc;
    await mongoose.model('Participant').deleteMany({ _id: { $in: participants } });
    await mongoose.model('Expense').deleteMany({ _id: { $in: expenses } });
    await mongoose.model('Payment').deleteMany({ _id: { $in: payments } });
});

export default mongoose.model<ITripModel>('Trip', TripSchema);
