interface ServiceCardProps {
  name: string;
}

const ServiceCard = ({ name }: ServiceCardProps) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center hover:shadow-md transition">
      <div className="w-10 h-10 bg-purple-100 flex items-center justify-center rounded-full mb-3">
        <span className="text-purple-600 font-bold">+</span>
      </div>
      <p className="text-gray-700 font-medium text-sm uppercase">{name}</p>
    </div>
  );
};

export default ServiceCard;
