import ServiceCard from "@/components/service-card/page";
import StatCard from "@/components/state-card/page";

export default function DashboardPage() {
  const services = [
    "ANOTHER SERVICE",
    "Video and Image Service",
    "Manually Service",
    "Non-call Service",
    "Other Services",
    "15 Minutes Service",
    "80 Minutes Service",
    "60 Minutes Service",
    "45 Minutes Service",
    "Latest Service 333",
  ];

  const appointments = [
    { client: "Emily Johnson", date: "Today, 3:00 PM", type: "Reiki Healing" },
    { client: "Michael Brown", date: "Tomorrow, 1:30 PM", type: "Sound Therapy" },
    { client: "Sarah Lee", date: "Wed, 10:00 AM", type: "Meditation Session" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Main content */}
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-2xl font-bold">Hello, zaheet 👋</h1>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Appointments" value="140" />
          <StatCard title="Balance" value="$8,010.00" subtitle="+$231.00 pending" />
          <StatCard title="Client Rating" value="4.4 / 5" />
        </div>

        {/* My Services */}
        <div>
          <h2 className="text-lg font-semibold mb-3">My Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => (
              <ServiceCard key={service} name={service} />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Missed Appointments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Missed Appointments</h2>
        <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
          {appointments.map((a, index) => (
            <div
              key={index}
              className="border-b pb-3 last:border-none flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{a.client}</p>
                <p className="text-sm text-gray-500">{a.date}</p>
                <p className="text-xs text-gray-400">{a.type}</p>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button className="px-3 py-1 text-sm rounded-md border border-blue-500 text-blue-500 hover:bg-blue-50">
                  Contact
                </button>
                <button className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600">
                  Reschedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
