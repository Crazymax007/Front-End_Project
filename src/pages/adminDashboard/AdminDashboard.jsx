import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormLabel,
  Box,
  TextField,
} from "@mui/material";
import {
  FcCloseUpMode,
  FcShop,
  FcOvertime,
  FcClearFilters,
} from "react-icons/fc";
import { useWindowSize } from "../../contexts/WindowSizeContext";

// 📌 ข้อมูล API
import { getVegetables } from "../../services/vegatableService";
import { getFarmers } from "../../services/farmerService";
import { getOrders } from "../../services/orderService";
import { getUsers } from "../../services/authService";
import { getBuyers } from "../../services/buyerService";

// 📌 นำเข้า Pie Chart จาก react-chartjs-2 และ Chart.js
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// 📌 กำหนดให้ ChartJS ใช้ ArcElement, BarElement, CategoryScale, LinearScale และ ChartDataLabels
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ChartDataLabels
);

const AdminDashboard = () => {
  const [vegetables, setVegetables] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [selectedVegetables, setSelectedVegetables] = useState({});
  const [startDate, setStartDate] = useState(""); // สถานะของเริ่ม
  const [endDate, setEndDate] = useState(""); // สถานะของสิ้นสุด
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]); // เล่ม state เก็บข้อมูลกรองแล้ว
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyers, setSelectedBuyers] = useState({});

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // คำนวณ index เล่มต้นและสิ้นสุดของข้อมูลในหน้า
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // กรองข้อมูลหน้า
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  useEffect(() => {
    fetchVegetables();
    fetchFarmers();
    fetchOrders();
    fetchUsers();
    fetchBuyers();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [selectedVegetables, selectedBuyers, startDate, endDate, orders]);

  const fetchVegetables = async () => {
    try {
      const response = await getVegetables();
      // เรียงลำดับผักตามชื่อ
      const sortedVegetables = response.data.sort((a, b) =>
        a.name.localeCompare(b.name, "th")
      );
      setVegetables(sortedVegetables);
      // สร้าง object เก็บสถานะการเลือกของแต่ละ
      const initialSelected = sortedVegetables.reduce((acc, veg) => {
        acc[veg._id] = false;
        return acc;
      }, {});
      setSelectedVegetables(initialSelected);
    } catch (error) {
      console.error("Failed to fetch vegetables:", error);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await getFarmers();
      setFarmers(response.data);
    } catch (error) {
      console.error("Failed to fetch farmers:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      if (response && response.data && response.data.data) {
        const allOrders = response.data.data
          .map((order) => {
            if (!order.details) return null;
            return order.details.map((detail) => ({
              id: detail._id,
              vegetableName: order.vegetable ? order.vegetable.name : "-",
              quantityOrdered: detail.quantityKg || 0,
              quantityDelivered: detail.delivery
                ? detail.delivery.actualKg || 0
                : 0,
              harvestDate:
                detail.delivery && detail.delivery.deliveredDate
                  ? new Date(detail.delivery.deliveredDate).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }
                  )
                  : "--",
              buyerId: order.buyer ? order.buyer._id : null, // เก็บ buyerId
              buyerName: order.buyer ? order.buyer.name : "-", // เก็บชื่อผู้ซื้อ
              dueDate: order.dueDate
                ? new Date(order.dueDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
                : "--",
            }));
          })
          .filter(Boolean)
          .flat();

        // console.log("Formatted Orders Data:", allOrders); // ตรวจสอบข้อมูลที่แปลงแล้ว
        setOrders(allOrders); // ตั้งค่า state orders
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const fetchBuyers = async () => {
    try {
      const response = await getBuyers();
      // เรียงลำดับผู้ซื้อตามชื่อ
      const sortedBuyers = response.data.sort((a, b) =>
        a.name.localeCompare(b.name, "th")
      );
      setBuyers(sortedBuyers);
      // Initialize selected buyers state
      const initialSelected = sortedBuyers.reduce((acc, buyer) => {
        acc[buyer._id] = false;
        return acc;
      }, {});
      setSelectedBuyers(initialSelected);
    } catch (error) {
      console.error("Failed to fetch buyers:", error);
    }
  };

  const handleBuyerChange = (event) => {
    const newSelection = {
      ...selectedBuyers,
      [event.target.name]: event.target.checked,
    };
    setSelectedBuyers(newSelection);
  };

  const handleVegetableChange = (event) => {
    const newSelection = {
      ...selectedVegetables,
      [event.target.name]: event.target.checked,
    };
    setSelectedVegetables(newSelection);
    // console.log("Selected Vegetables: ", newSelection);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    // console.log("Start Date: ", e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // 🫛 กรองตามผัก
    const selectedVegIds = Object.entries(selectedVegetables)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedVegIds.length > 0) {
      filtered = filtered.filter((order) => {
        const vegetable = vegetables.find(
          (v) => v.name === order.vegetableName
        );
        return vegetable && selectedVegIds.includes(vegetable._id);
      });
    }

    //🛒 กรองตามผู้ซื้อ
    const selectedBuyerIds = Object.entries(selectedBuyers)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedBuyerIds.length > 0) {
      filtered = filtered.filter((order) => {
        return selectedBuyerIds.includes(order.buyerId); // ตรวจสอบว่า buyerId ตรงกับที่เลือกหรือไม่
      });
    }

    // กรองตาม วัน
    if (endDate) {
      filtered = filtered.filter((order) => {
        if (order.harvestDate === "--") return false;

        try {
          // แปลง วันจากฐานข้อมูลให้เป็น วันที่ต้องการ
          const [day, month, year] = order.harvestDate.split("/");
          const orderDate = new Date(
            parseInt(year), // ใช้ปีในรูปแบบคริสต์ศักราช
            parseInt(month) - 1,
            parseInt(day)
          );

          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // ตั้งเวลาสิ้นสุดเป็น 23:59:59

          // ถ้าไม่มี startDate ให้แสดงข้อมูลตั้งแต่ endDate ย้อนกลับไป
          return orderDate <= end;
        } catch (error) {
          console.error("Date parsing error:", error);
          return false;
        }
      });
    }

    if (startDate) {
      filtered = filtered.filter((order) => {
        if (order.harvestDate === "--") return false;

        try {
          // แปลง วันจากฐานข้อมูลให้เป็น วันที่ต้องการ
          const [day, month, year] = order.harvestDate.split("/");
          const orderDate = new Date(
            parseInt(year), // ใช้ปีในรูปแบบคริสต์ศักราช
            parseInt(month) - 1,
            parseInt(day)
          );

          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0); // ตั้งเวลาเริ่มต้นเป็น 00:00:00

          return orderDate >= start; // กรองตาม startDate
        } catch (error) {
          console.error("Date parsing error:", error);
          return false;
        }
      });
    }

    // console.log("Filtered Orders:", filtered); // ตรวจสอบข้อมูลที่กรอง
    setFilteredOrders(filtered);
    updatePieChartData(filtered);
    updateBarChartData(filtered);
  };

  const updatePieChartData = (filteredData) => {
    // กลุ่มข้อมูลตาม buyer
    const buyerGroups = filteredData.reduce((acc, order) => {
      const buyerId = order.buyerId; // ใช้ buyerId จากคำสั่งซื้อ
      const buyerName = order.buyerName; // ชื่อผู้ซื้อ

      // ตรวจสอบว่า buyerName ไม่เป็น '-' หรือ null
      if (buyerName && buyerName !== "-") {
        if (!acc[buyerId]) {
          acc[buyerId] = {
            buyerName: buyerName, // ชื่อผู้ซื้อ
            totalDelivered: 0,
          };
        }
        acc[buyerId].totalDelivered += order.quantityDelivered;
      }
      return acc;
    }, {});

    // ตรวจสอบว่ามีผู้ซื้อหรือไม่
    if (Object.keys(buyerGroups).length === 0) {
      // ถ้าไม่มีผู้ซื้อ ให้รีเซ็ต pieData
      setPieData({
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            hoverBackgroundColor: [],
          },
        ],
      });
      return; // ออกจากฟังก์ชัน
    }

    // กำหนดค่าสีไม่ซ้ำ
    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#FF9F40",
      "#9966FF",
      "#FF6384",
      "#C9CBCF",
      "#4D5360",
      "#FF99CC",
      "#99CCFF",
      "#FFB366",
      "#99FF99",
      "#FF99CC",
      "#CC99FF",
    ];

    // คำนวณเปอร์เซ็นต์และตั้งค่าชื่อแต่ละ Buyer
    const totalDelivered = Object.values(buyerGroups).reduce(
      (sum, group) => sum + group.totalDelivered,
      0
    );

    const labels = Object.keys(buyerGroups).map((buyerId) => {
      const buyer = buyerGroups[buyerId];
      const percentage = (
        (buyer.totalDelivered / totalDelivered) *
        100
      ).toFixed(1);
      return `${buyer.buyerName} (${buyer.totalDelivered} กก. ${percentage}%)`;
    });

    // ตั้งค่าข้อมูล Pie Chart
    setPieData({
      labels: labels,
      datasets: [
        {
          data: Object.values(buyerGroups).map((group) => group.totalDelivered),
          backgroundColor: colors.slice(0, Object.keys(buyerGroups).length),
          hoverBackgroundColor: colors.slice(
            0,
            Object.keys(buyerGroups).length
          ),
        },
      ],
    });
  };

  const updateBarChartData = (filteredData) => {
    // กลุ่มข้อมูลตามชื้อ
    const vegGroups = filteredData.reduce((acc, order) => {
      if (!acc[order.vegetableName]) {
        acc[order.vegetableName] = 0;
      }
      acc[order.vegetableName] += order.quantityDelivered;
      return acc;
    }, {});

    const colors = [
      "#FF6384", // ชม
      "#36A2EB", // ฟ้า
      "#FFCE56", // ยืด
      "#4BC0C0", // น้ำเงิน
      "#FF9F40", // ส้ม
      "#9966FF", // ม่วง
      "#FF6384", // ชมเข้ม
      "#C9CBCF", // เทา
      "#4D5360", // เทาเข้ม
      "#FF99CC", // ชมอ่อน
      "#99CCFF", // ฟ้าอ่อน
      "#FFB366", // ส้มอ่อน
      "#99FF99", // น้ำเงินอ่อน
      "#FF99CC", // ชมอ่อน
      "#CC99FF", // ม่วงอ่อน
    ];

    setBarData({
      labels: Object.keys(vegGroups),
      datasets: [
        {
          label: "จำนวน (กก.)",
          data: Object.values(vegGroups),
          backgroundColor: colors.slice(0, Object.keys(vegGroups).length),
          borderColor: "#ffff",
          borderWidth: 1,
        },
      ],
    });
  };

  // เล่ม state Pie Chart
  const [pieData, setPieData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        hoverBackgroundColor: [],
      },
    ],
  });

  // เล่ม options Pie Chart
  const { width } = useWindowSize();

  const pieOptions = {
    plugins: {
      legend: {
        position: width < 1024 ? 'top' : 'right',
        align: width < 1024 ? 'center' : 'start',
        labels: {
          boxWidth: 15,
          padding: width < 1024 ? 10 : 15,
          font: {
            size: 12,
          },
        },
        display: true,
        overflow: "scroll",
        maxHeight: width < 1024 ? 150 : 350,
      },
      datalabels: {
        formatter: (value, context) => {
          const label = context.chart.data.labels[context.dataIndex];
          const total = context.chart.data.datasets[0].data.reduce(
            (a, b) => a + b,
            0
          ); // ใช้ context.chart.data แทน context.chart._data
          const percentage = ((value / total) * 100).toFixed(1); // คำนวณเปอร์เซ็นต์
          return `${value.toLocaleString()} กก. (${percentage}%)`; // แสดงชื่อ, จำนวน และเปอร์เซ็นต์
        },
        color: "#000",
      },
    },
    layout: {
      padding: {
        left: 0,
        right: 20,
        top: 0,
        bottom: 0,
      },
    },
    maintainAspectRatio: false,
  };

  // เล่ม state Bar Chart
  const [barData, setBarData] = useState({
    labels: [],
    datasets: [
      {
        label: "จำนวนผลิต (กก.)",
        data: [],
        backgroundColor: "#4BC0C0",
        borderColor: "#36A2EB",
        borderWidth: 1,
      },
    ],
  });

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "จำนวน (กก.)",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        anchor: "end",
        align: "end",
        formatter: (value) => value.toLocaleString(),
        color: "#000",
      },
    },
  };

  // เล่ม ฟังก์ชัน นำออกข้อมูล CSV
  const exportToCSV = () => {
    // กำหนดข้อมูลที่จะนำออก
    const dataToExport = filteredOrders.length > 0 ? filteredOrders : orders;

    // สร้างข้อ CSV
    const headers = [
      "ลำดับ",
      "ชื่อ",
      "จำนวนผลิต (กก.)",
      "จำนวนส่ง (กก.)",
      "วันเก็บ",
      "ผู้ซื้อ",
    ];

    // แปลงข้อมูลเป็น CSV
    const csvContent = [
      headers.join(","),
      ...dataToExport.map((item, index) =>
        [
          index + 1,
          item.vegetableName,
          item.quantityOrdered,
          item.quantityDelivered,
          item.harvestDate,
          item.buyerName,
        ].join(",")
      ),
    ].join("\n");

    // สร้าง Blob และดาวน์โหลดไฟล์
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // สร้างชื่อไฟล์ตามวันที่
    const today = new Date().toISOString().split("T")[0];
    const fileName = `รายงานการส่งผลิต_${today}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* ข้างบน */}
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex flex-col lg:flex-row gap-2">
          {/* เลือกผัก */}
          <div className="bg-white w-full lg:w-[25%] border border-black rounded-lg p-4 min-w-0">
            <div className="h-[30vh] sm:h-[40vh] md:h-[50vh] overflow-y-auto">
              <FormGroup className="">
                <FormLabel
                  component="legend"
                  className="mb-2 flex items-center gap-2"
                >
                  <FcCloseUpMode />
                  เลือกผัก
                </FormLabel>
                {vegetables.map((vegetable) => (
                  <FormControlLabel
                    key={vegetable._id}
                    control={
                      <Checkbox
                        checked={selectedVegetables[vegetable._id] || false}
                        onChange={handleVegetableChange}
                        name={vegetable._id}
                      />
                    }
                    label={vegetable.name}
                  />
                ))}
              </FormGroup>
            </div>
          </div>
          {/* Pie chart */}
          <div className="bg-white w-full lg:w-[75%] flex flex-col border border-black rounded-lg p-4 min-w-0">
            <div>ผลผลิตรวมแยกตามผู้ซื้อ (กก.)</div>
            <div style={{ height: "300px" }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="w-full lg:w-[25%] ">
            <div className="flex flex-row lg:flex-col gap-2">
              <div className="bg-white w-[50%] lg:w-full border border-black rounded-lg p-4">
                <div className="h-[30vh] overflow-y-auto">
                  <FormGroup className="min-w-[200px] overflow-x-auto">
                    <FormLabel
                      component="legend"
                      className="mb-2 flex items-center gap-2"
                    >
                      <FcShop />
                      เลือกผู้ซื้อ
                    </FormLabel>
                    {buyers.map((buyer) => (
                      <FormControlLabel
                        key={buyer._id}
                        control={
                          <Checkbox
                            checked={selectedBuyers[buyer._id] || false}
                            onChange={handleBuyerChange}
                            name={buyer._id}
                          />
                        }
                        label={buyer.name}
                      />
                    ))}
                  </FormGroup>
                </div>
              </div>
              <div className="bg-white w-[50%] lg:w-full border border-black rounded-lg p-4 overflow-auto">
                <FormGroup className="flex flex-col gap-2 min-w-[200px] overflow-x-auto">
                  <div className="flex justify-between">
                    <FormLabel
                      component="legend"
                      className="mb-2 flex items-center gap-2"
                    >
                      <FcOvertime />
                      เลือกช่วงเวลา
                    </FormLabel>
                    <button
                      onClick={handleClearDates}
                      className="bg-gray-200 p-2 rounded-full"
                    >
                      <FcClearFilters />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <TextField
                      label="วันเริ่มต้น"
                      type="date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="สิ้นสุด"
                      type="date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      fullWidth
                      size="small"
                      inputProps={{
                        min: startDate, // กำหนดค่าต่ำสุดเป็นวันเริ่มต้น
                      }}
                    />
                  </div>
                </FormGroup>
              </div>
            </div>
          </div>
          <div className="bg-white w-full lg:w-[75%] border border-black rounded-lg p-4">
            <div className="text-lg mb-2">ผลผลิตรวมแยกตามชื้อ (กก.)</div>
            <div className="h-[40vh] overflow-x-auto">
              <div className="min-w-[800px]">
                <Bar className="w-full" data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ตาราง 💻 */}
      <div className="flex flex-col gap-2">
        {/* นำออกข้อมูล */}
        <div className="flex justify-end">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 text-sm text-white bg-Green-button rounded-lg hover:bg-green-600"
          >
            นำออกข้อมูล CSV
          </button>
        </div>
        {/* ตาราง */}
        <div className="w-full bg-white border border-black rounded-lg">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px] overflow-hidden rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="">
                  <tr className="bg-gray-200">
                    <th className="px-6 py-4 font-bold text-gray-600 first:rounded-tl-lg w-[80px]">
                      ลำดับ
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-600 w-[200px]">
                      ชื่อ
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-600 w-[200px]">
                      ผู้ซื้อ
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-600 w-[150px]">
                      จำนวนผลิต (กก.)
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-600 w-[150px]">
                      จำนวนส่ง (กก.)
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-600 w-[200px]">
                      กำหนดส่ง
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-600 w-[200px]">
                      วันเก็บ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((item, index) => {
                    // console.log(`Order item: ${index + 1}`, item);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-600">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.vegetableName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.buyerName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.quantityOrdered}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.quantityDelivered}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.dueDate}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.harvestDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-4 mb-4">
          {/* Show these buttons only on md screens and up */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="hidden md:block px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            หน้าแรก
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            ก่อนหน้า
          </button>

          {/* Show page numbers only on md screens and up */}
          <div className="hidden md:flex gap-2">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-4 py-2 text-sm rounded-lg ${currentPage === pageNumber
                      ? "bg-green-500 text-white"
                      : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                      }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                pageNumber === currentPage - 3 ||
                pageNumber === currentPage + 3
              ) {
                return (
                  <span
                    key={pageNumber}
                    className="px-4 py-2 text-sm text-gray-600"
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            ถัดไป
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="hidden md:block px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            หน้าสุดท้าย
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
