import { CalendarCheck, CalendarDays, CalendarX, ChevronRight, ClipboardList, HeartPulse, LayoutDashboard, MessageSquareText, Stethoscope, UserRound, UserRoundPlus, X } from 'lucide-react';
import React, { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom';

const adminMenu = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/admin-dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "HOSPITAL MANAGEMENT",
    items: [
      {
        label: "Add Doctor",
        path: "/admin/add-doctor",
        icon: UserRoundPlus,
      },
      {
        label: "Doctor List",
        path: "/admin/doctor-list",
        icon: Stethoscope,
      },
      {
        label: "All Appointments",
        path: "/admin/appointments",
        icon: CalendarCheck,
      },
      {
        label: "Manage Holidays",
        path: "/admin/manage-holidays",
        icon: CalendarDays,
      },
      {
        label:"Mange Leave",
        path:"/admin/manage-leave",
        icon:CalendarDays
      }
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      {
        label: "Enquiries",
        path: "/admin/enquiries",
        icon: MessageSquareText,
      },
    ],
  },
];

const doctorMenu = [
  {
    title: "WORKSPACE",
    items: [
      {
        label: "Dashboard",
        path: "/doctor-dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "All Appointments",
        path: "/doctor/appointments",
        icon: CalendarCheck,
      },
      {
        label: "Appointment Details",
        path: "/doctor/appointment-details",
        icon: ClipboardList,
      },
      {
        label: "Doctor Profile",
        path: "/doctor/profile",
        icon: UserRound,
      },
       {
        label: "Doctor Leave",
        path: "/doctor/leave",
        icon: Stethoscope,
      },
    ],
  },
];


const Sidebar = ({open = false, onClose = () => {}}) => {
  const location = useLocation();
  const isDoctor = location.pathname.startsWith("/doctor");
  const menuGroups = isDoctor ? doctorMenu : adminMenu;
  useEffect(()=>{
    onClose();
  },[location.pathname])

  useEffect(()=>{
    if(!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => {
      if(event.key === "Escape") onClose();
    }
    window.addEventListener("keydown",handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown",handleEscape);
    }
  },[open,onClose])
  return (
    <div>
     {/* --mobile-backdrop-- */}
     <div onClick={onClose} aria-hidden="true" className={`fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${open ? "pointer-events-auto opacity-100":"pointer-events-none opacity-0"}`}/>
     <aside className={`fixed inset-y-0 left-0 z-[70] flex w-[min(290px,85vw)] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-[72px] lg:z-30 lg:h-[calc(100dvh-72px)] lg:w-[270px] lg:shrink-0 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0":"-translate-x-full"}`} id='app-sidebar' aria-label={`${isDoctor ? "Doctor":"Admin"} navigation`}>
      <div className='flex min-h-[88px] items-center justify-between border-b border-slate-100 px-5 py-4 lg:min-h-[86px]'>
       <div className='flex min-w-0 items-center gap-3'>
        <div className='flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/20'>
         <HeartPulse size={22}/>
        </div>
        <div className='min-w-0'>
         <p className='text-[10px] font-extrabold tracking-[0.16em] text-slate-400'>YOUR WORKSPACE</p>
          <h2 className="mt-1 truncate text-base font-extrabold text-slate-900">
                {isDoctor ? "Doctor Panel" : "Admin Panel"}
          </h2>
        </div>
       </div>
       <button className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden' type='button' onClick={onClose} aria-label='Close sidebar'>
         <X size={20}/>
       </button>
      </div>
      <nav className='flex-1 space-y-7 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-6'>
       {menuGroups.map((group)=>(
        <div key={group.title}>
         <p className='mb-3 px-3 text-[10px] font-extrabold tracking-[0.16em] text-slate-400'>{group.title}</p>
         <div className='space-y-1.5'>
          {group.items.map((item)=>{
            const Icon = item.icon;
            return (
              <NavLink className={({isActive})=>`group relative flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-600/20":"text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`} key={item.path} to={item.path} end onClick={onClose}>
               {({isActive})=>(
                <>
                <Icon size={19} className='shrink-0' strokeWidth={isActive ? 2.4 : 1.9}/>
                <span className='min-w-0 flex-1 leading-5'>{item.label}</span>
                <ChevronRight size={16} className={`shrink-0 transition-all duration-200 ${isActive ? "translate-x-0 opacity-100":"-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}/>
                </>
               )}
              </NavLink>
            )
          })}
         </div>
        </div>
       ))}
      </nav>
      <div className='shrink-0 border-t border-slate-100 bg-white p-4'>
       <div className='rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50 to-cyan-50 p-4'>
        <div className='flex items-center gap-3'>
         <div className='flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm'>   
          <HeartPulse size={21}/>
         </div>
         <div className='min-w-0'>
          <p className="truncate text-xs font-extrabold text-slate-800">
            MediCare HMS
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Healthcare workspace
          </p>
         </div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
              {isDoctor
                ? "Manage your schedule and patient appointments."
                : "Manage hospital operations from one place."}
        </p>
       </div>
      </div>
     </aside>
    </div>
  )
}

export default Sidebar