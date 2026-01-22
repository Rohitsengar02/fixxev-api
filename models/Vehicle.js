const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
    lastServiceDate: Date,
    nextServiceDue: Date,
    serviceType: String,
    status: { type: String, default: 'Pending' }
});

const warrantySchema = new mongoose.Schema({
    provider: String,
    expiryDate: Date,
    policyNumber: String,
    status: { type: String, default: 'Active' }
});

const insuranceSchema = new mongoose.Schema({
    provider: String,
    expiryDate: Date,
    policyNumber: String,
    status: { type: String, default: 'Active' }
});

const partHistorySchema = new mongoose.Schema({
    partName: String,
    replaceDate: Date,
    cost: Number,
    notes: String
});

const serviceRecordSchema = new mongoose.Schema({
    date: Date,
    type: String,
    description: String,
    cost: Number,
    odometer: Number
});

const vehicleSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    year: String,
    plateNumber: {
        type: String,
        required: true
    },
    vin: String,
    photoURL: String,
    batteryCapacity: String,
    batteryLevel: {
        type: Number,
        default: 100
    },
    range: {
        type: Number,
        default: 0
    },

    // Expanded Fields
    maintenance: maintenanceSchema,
    warranty: warrantySchema,
    insurance: insuranceSchema,
    partsHistory: [partHistorySchema],
    serviceRecords: [serviceRecordSchema],

    isDefault: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
