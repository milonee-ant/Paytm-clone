import { useEffect, useState } from "react";
import { AppBar } from "../components/AppBar";
import { Balance } from "../components/Balance";
import { UserComponent } from "../components/UserComponent";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import ReactLoading from "react-loading";
import { useNavigate } from "react-router-dom";
export const Dashboard = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  useEffect(() => {
    setIsLoading(true);
    if (
      localStorage.getItem("token") == null ||
      localStorage.getItem("token") == undefined
    ) {
      setIsLoading(false);
      navigate("/signin");
    }
    const fetchBalance = async (userId) => {
      const response = await axios.get(
        "http://localhost:3000/api/v1/account/balance?userId=" + userId,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      if (response.data.balance != null) {
        const abs = Math.abs(parseInt(response.data.balance));
        setBalance(abs);
        setIsLoading(false);
      }
      setIsLoading(false);
    };
    fetchBalance(userId);
  }, [userId]);
  return (
    <div className="h-screen" style={{backgroundColor: '#E8E8E8'}}>
      {!isLoading && (
        <div>
          <AppBar name={userId} />
          <Balance value={balance} />
          <div className="px-9 mt-6 mb-4">
            <button
              onClick={() => navigate("/analytics?userId=" + userId)}
              className="w-full md:w-auto px-6 py-3 rounded-md text-white font-medium hover:opacity-90 transition-opacity"
              style={{backgroundColor: '#00D4AA'}}
            >
              Review My Spending
            </button>
          </div>
          <UserComponent username={userId} />
        </div>
      )}
      {isLoading && (
        <div className="flex flex-col justify-center items-center h-screen">
          <ReactLoading type="bars" color="#2B4C7E" height={100} width={100} />
        </div>
      )}
    </div>
  );
};
