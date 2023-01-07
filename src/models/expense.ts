import mongoose, { Document, Schema } from 'mongoose';

interface IPaidBy {
    user: string;
    amount: number;
}
export interface IExpense {
    trip: string;
    name: string;
    amount: number;
    category: string;
    description: string;
    paid_by: IPaidBy[];
    paid_for: IPaidBy[];
}

export interface IExpenseModel extends IExpense, Document {}

const ExpenseSchema: Schema = new Schema(
    {
        trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        category: { type: String, enum: ['food', 'transport', 'accomodation', 'shopping', 'entertainment', 'other'], required: true, default: 'other' },
        description: { type: String, default: '' },
        paid_by: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
                amount: { type: Number, required: true }
            }
        ],
        paid_for: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
                amount: { type: Number, required: true }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model<IExpenseModel>('Expense', ExpenseSchema);
