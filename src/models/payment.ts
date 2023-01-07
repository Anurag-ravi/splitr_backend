import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment {
    trip: string;
    amount: number;
    description: string;
    paid_by: string;
    paid_for: string;
}

export interface IPaymentModel extends IPayment, Document {}

const PaymentSchema: Schema = new Schema(
    {
        trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
        amount: { type: Number, required: true },
        description: { type: String, default: '' },
        paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
        paid_for: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model<IPaymentModel>('Payment', PaymentSchema);
