import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    commissionRate: {
      type: Number,
      required: true,
      default: 10
    },
    commissionAmount: {
      type: Number,
      required: true
    },
    totalSales: {
      type: Number,
      required: true
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentDate: {
      type: Date
    },
    paymentMethod: {
      type: String,
      enum: ['transfer', 'pix', 'check', 'cash', 'other'],
      default: 'transfer'
    },
    notes: {
      type: String
    },
    sales: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale'
      }
    ],
    hasDividedCommissions: {
      type: Boolean,
      default: false
    },
    dividedCommissionDetails: [{
      bookTitle: String,
      numberOfAuthors: Number,
      coAuthors: [String],
      saleTotal: Number,
      originalRate: Number,
      dividedRate: String,
      commission: String
    }],
    integralCommissionDetails: [{
      bookTitle: String,
      saleTotal: Number,
      rate: Number,
      commission: String
    }]
  },
  {
    timestamps: true
  }
);

const Commission = mongoose.model('Commission', commissionSchema);

export default Commission;