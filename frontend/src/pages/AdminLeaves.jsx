import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getLeaveTypes,
    addLeaveType,
    updateLeaveType,
    getLeaveRules,
    updateLeaveRule,
    getCreditRules,
    updateCreditRule,
} from "../util/admin";
import { fetchGlobals } from "../store/global";

export default function AdminLeaves() {
    const dispatch = useDispatch();
    const leaveTypes = useSelector((s) => s.global.leaveTypes);

    const [selectedLeaveType, setSelectedLeaveType] = useState(null);
    const [leaveRules, setLeaveRules] = useState([]);
    const [creditRules, setCreditRules] = useState([]);
    const [newLeaveType, setNewLeaveType] = useState({
        name: "",
        defaultBalance: "",
    });

    const [originalLeaveRules, setOriginalLeaveRules] = useState([]);
    const [originalCreditRules, setOriginalCreditRules] = useState([]);




    // Fetch leave types on load
    useEffect(() => {
        if (!leaveTypes || Object.keys(leaveTypes).length === 0) {
            dispatch(fetchGlobals());
        }
    }, [dispatch, leaveTypes]);

    // Fetch rules when leave type selected
    const handleSelectLeaveType = async (lt) => {
        setSelectedLeaveType(lt);
        const leaveTypeId = lt.leaveTypeId;
        if (!leaveTypeId) return;

        try {
            const [rules, credits] = await Promise.all([
                getLeaveRules(leaveTypeId),
                getCreditRules(leaveTypeId),
            ]);

            setLeaveRules(rules || []);
            setCreditRules(credits || []);

            // Keep deep copies for diffing later
            setOriginalLeaveRules(JSON.parse(JSON.stringify(rules || [])));
            setOriginalCreditRules(JSON.parse(JSON.stringify(credits || [])));
        } catch (err) {
            console.error("Error fetching rules:", err);
        }
    };

    const getChangedFields = (original, updated) => {
        const diff = {};
        for (const key in updated) {
            if (
                !["id", "leave_type_id", "createdAt", "updatedAt"].includes(key) &&
                JSON.stringify(original[key]) !== JSON.stringify(updated[key])
            ) {
                diff[key] = updated[key];
            }
        }
        return diff;
    };


    // Handle add leave type
    const handleAddLeaveType = async (e) => {
        e.preventDefault();
        if (!newLeaveType.name) return alert("Leave type name required");
        await addLeaveType(newLeaveType);
        setNewLeaveType({ name: "", defaultBalance: "" });
        dispatch(fetchGlobals());
    };

    // Update rule helper
    const handleRuleChange = (ruleList, setRuleList, id, field, value) => {
        const updated = ruleList.map((r) =>
            r.id === id ? { ...r, [field]: value } : r
        );
        setRuleList(updated);
    };

    const handleSaveRule = async (rule, type) => {
        const originalList = type === "leave" ? originalLeaveRules : originalCreditRules;
        const originalRule = originalList.find((r) => r.id === rule.id);

        if (!originalRule) {
            alert("Original rule not found!");
            return;
        }

        const changedFields = getChangedFields(originalRule, rule);
        if (Object.keys(changedFields).length === 0) {
            alert("No changes to save!");
            return;
        }

        // Type normalization
        const cleanRule = Object.fromEntries(
            Object.entries(changedFields).map(([key, value]) => [
                key,
                value === "true"
                    ? true
                    : value === "false"
                        ? false
                        : !isNaN(value) && value !== ""
                            ? Number(value)
                            : value,
            ])
        );

        if (!cleanRule.leave_type_id && rule.leave_type_id) {
            cleanRule.leave_type_id = rule.leave_type_id;
        }

        try {
            if (type === "leave") await updateLeaveRule(rule.id, cleanRule);
            else await updateCreditRule(rule.id, cleanRule);

            alert("Rule updated successfully!");
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to update rule.");
        }
    };



    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Leave Type Management</h2>

            {/* Add Leave Type */}
            <div className="border p-3 rounded-xl">
                <h3 className="font-semibold mb-2">Add Leave Type</h3>
                <form onSubmit={handleAddLeaveType} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Leave Type Name"
                        value={newLeaveType.name}
                        onChange={(e) =>
                            setNewLeaveType({ ...newLeaveType, name: e.target.value })
                        }
                        className="border p-2 rounded w-60"
                    />
                    <input
                        type="number"
                        placeholder="Default Balance"
                        value={newLeaveType.defaultBalance}
                        onChange={(e) =>
                            setNewLeaveType({
                                ...newLeaveType,
                                defaultBalance: e.target.value,
                            })
                        }
                        className="border p-2 rounded w-40"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 rounded"
                    >
                        Add
                    </button>
                </form>
            </div>

            {/* Leave Types List */}
            <div>
                <h3 className="font-semibold mb-2">All Leave Types</h3>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(leaveTypes || {}).map(([key, lt]) => (
                        <button
                            key={key}
                            onClick={() => handleSelectLeaveType({ ...lt, key })}
                            className={`px-3 py-2 border rounded-lg ${selectedLeaveType?.key === key
                                ? "bg-blue-600 text-white"
                                : "bg-white"
                                }`}
                        >
                            {lt.fullName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Leave Type Rules */}
            {selectedLeaveType && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">
                        Rules for: {selectedLeaveType.fullName}
                    </h3>

                    {/* Leave Rules */}
                    <div className="border p-4 rounded-xl mb-6">
                        <h4 className="font-semibold mb-2">Leave Rules</h4>
                        {leaveRules.map((rule) => (
                            <div
                                key={rule.id}
                                className="border p-3 rounded-lg mb-2 bg-gray-50"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Rule ID: {rule.id}</span>
                                    <button
                                        className="text-sm bg-green-600 text-white px-2 py-1 rounded"
                                        onClick={() => handleSaveRule(rule, "leave")}
                                    >
                                        Save
                                    </button>
                                </div>
                                {Object.entries(rule).map(([field, value]) =>
                                    ["id", "leave_type_id", "createdAt", "updatedAt"].includes(
                                        field
                                    ) ? null : (
                                        <div key={field} className="mt-1 flex items-center gap-2">
                                            <label className="w-48 text-sm text-gray-700">
                                                {field}
                                            </label>
                                            <input
                                                className="border p-1 rounded w-64"
                                                value={value ?? ""}
                                                onChange={(e) =>
                                                    handleRuleChange(
                                                        leaveRules,
                                                        setLeaveRules,
                                                        rule.id,
                                                        field,
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Credit Rules */}
                    <div className="border p-4 rounded-xl">
                        <h4 className="font-semibold mb-2">Credit Rules</h4>
                        {creditRules.map((rule) => (
                            <div
                                key={rule.id}
                                className="border p-3 rounded-lg mb-2 bg-gray-50"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Rule ID: {rule.id}</span>
                                    <button
                                        className="text-sm bg-green-600 text-white px-2 py-1 rounded"
                                        onClick={() => handleSaveRule(rule, "credit")}
                                    >
                                        Save
                                    </button>
                                </div>
                                {Object.entries(rule).map(([field, value]) =>
                                    ["id", "leave_type_id", "createdAt", "updatedAt"].includes(
                                        field
                                    ) ? null : (
                                        <div key={field} className="mt-1 flex items-center gap-2">
                                            <label className="w-48 text-sm text-gray-700">
                                                {field}
                                            </label>
                                            <input
                                                className="border p-1 rounded w-64"
                                                value={value ?? ""}
                                                onChange={(e) =>
                                                    handleRuleChange(
                                                        creditRules,
                                                        setCreditRules,
                                                        rule.id,
                                                        field,
                                                        e.target.type === "number" ? Number(e.target.value) : e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
