import { useEffect, useState } from "react";
import { AppBar } from "../components/AppBar";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactLoading from "react-loading";

export const SpendingAnalytics = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get("userId");
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        // Auth check
        if (!localStorage.getItem("token")) {
            navigate("/signin");
            return;
        }

        // Fetch analytics
        const fetchAnalytics = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:3000/api/v1/account/analytics",
                    {
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("token")
                        }
                    }
                );
                setAnalytics(response.data);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to load analytics:", err);
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [navigate]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Check if user has any transaction data
    const hasData = analytics && (
        analytics.spendingByPerson.length > 0 ||
        analytics.spendingByCategory.length > 0
    );

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen" style={{backgroundColor: '#E8E8E8'}}>
                <ReactLoading type="bars" color="#2B4C7E" height={100} width={100} />
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{backgroundColor: '#E8E8E8'}}>
            <AppBar name={userId} />

            <div className="p-8">
                <div className="mb-6">
                    <button
                        onClick={() => navigate("/dashboard?userId=" + userId)}
                        className="text-sm px-4 py-2 rounded-md text-white hover:opacity-90"
                        style={{backgroundColor: '#2B4C7E'}}
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <h1 className="text-3xl font-bold mb-8">Spending Analytics</h1>

                {!hasData ? (
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <p className="text-xl text-gray-600">
                            No spending data yet. Complete a transfer to start tracking your spending!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Month Comparison Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">This Month</h3>
                                <p className="text-2xl font-bold" style={{color: '#2B4C7E'}}>
                                    {formatCurrency(analytics.thisMonthTotal)}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Last Month</h3>
                                <p className="text-2xl font-bold" style={{color: '#2B4C7E'}}>
                                    {formatCurrency(analytics.lastMonthTotal)}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Change</h3>
                                <p className={`text-2xl font-bold ${
                                    analytics.thisMonthTotal > analytics.lastMonthTotal
                                        ? 'text-red-600'
                                        : 'text-green-600'
                                }`}>
                                    {analytics.lastMonthTotal === 0
                                        ? 'N/A'
                                        : `${((analytics.thisMonthTotal - analytics.lastMonthTotal) / analytics.lastMonthTotal * 100).toFixed(1)}%`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Spending by Person Section */}
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                            <h2 className="text-xl font-bold mb-4">Spending by Person</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4">Recipient</th>
                                            <th className="text-right py-3 px-4">Amount</th>
                                            <th className="text-right py-3 px-4">Transactions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.spendingByPerson.map((person, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4">{person.receiverName}</td>
                                                <td className="text-right py-3 px-4 font-semibold">
                                                    {formatCurrency(person.totalAmount)}
                                                </td>
                                                <td className="text-right py-3 px-4">
                                                    {person.transactionCount}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Spending by Category Section */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4">Category</th>
                                            <th className="text-right py-3 px-4">Amount</th>
                                            <th className="text-right py-3 px-4">Transactions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.spendingByCategory.map((category, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 flex items-center">
                                                    <span className="w-3 h-3 rounded-full mr-3"
                                                          style={{backgroundColor: '#00D4AA'}}></span>
                                                    {category._id}
                                                </td>
                                                <td className="text-right py-3 px-4 font-semibold">
                                                    {formatCurrency(category.totalAmount)}
                                                </td>
                                                <td className="text-right py-3 px-4">
                                                    {category.transactionCount}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
