import React from 'react';

const leaveData = [
  {
    type: 'Casual Leave (CL)',
    duration: '8-12 days/year',
    documentation: 'None required',
    conditions: 'Short-term personal matters',
  },
  {
    type: 'Medical Leave (ML)',
    duration: '10-15 days/year',
    documentation: 'Medical certificate',
    conditions: 'Illness or medical emergencies',
  },
  {
    type: 'Special Casual Leave (SCL)',
    duration: 'Varies',
    documentation: 'Proof of seminar/workshop',
    conditions: 'Specific purposes like seminars',
  },
  {
    type: 'Extraordinary Leave (EOL)',
    duration: 'Up to 1 year',
    documentation: 'Reason for extended absence',
    conditions: 'Extended absence without pay',
  },
  {
    type: 'Earned Leave (EL)',
    duration: 'Accumulated annually',
    documentation: 'None required',
    conditions: 'Planned vacations or commitments',
  },
  {
    type: 'On Duty Leave (ODL)',
    duration: 'Varies',
    documentation: 'Duty proof (letter from department)',
    conditions: 'Official duties',
  },
  {
    type: 'Maternity Leave (ML)',
    duration: '26 weeks (first two)',
    documentation: 'Medical certificate',
    conditions: 'Pregnancy and post-delivery',
  },
  {
    type: 'Election Leave',
    duration: '1 day',
    documentation: 'Voting proof',
    conditions: 'Voting day',
  },
  {
    type: 'Compensatory Leave (CPL)',
    duration: 'Equivalent to worked time',
    documentation: 'Proof of work on holidays',
    conditions: 'Work on holidays',
  },
  {
    type: 'Without Pay Leave (LWP)',
    duration: 'Varies',
    documentation: 'None required',
    conditions: 'Salary deduction for leave period',
  },
];

const LeaveInfo = () => {
  return (
    <div className="p-6 overflow-x-auto">
      <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">
        Leave Types
      </h2>
      {/* <p className="text-center text-sm text-gray-600 mb-6">
        <em>Note: Approval is required for all leave types.</em>
      </p> */}
      <table className="min-w-full text-base text-left border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <thead>
          <tr className="bg-gray-800 text-white text-lg">
            <th className="px-6 py-4">Leave Type</th>
            <th className="px-6 py-4">Duration</th>
            <th className="px-6 py-4">Documentation Required</th>
            <th className="px-6 py-4">Special Conditions</th>
          </tr>
        </thead>
        <tbody>
          {leaveData.map((leave, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: index % 2 === 0 ? 'white' : '#f5f5dc',
              }}
              className="text-lg"
            >
              <td className="px-6 py-4 font-semibold">{leave.type}</td>
              <td className="px-6 py-4">{leave.duration}</td>
              <td className="px-6 py-4">{leave.documentation}</td>
              <td className="px-6 py-4">{leave.conditions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveInfo;
