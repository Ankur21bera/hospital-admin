import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom';
import { doctorLogout } from '../Redux/doctorSlice';
import { adminLogout } from '../Redux/adminSlice';
import toast from 'react-hot-toast';
import { Activity, Loader2, LogOut, Menu, ShieldCheck, Stethoscope } from 'lucide-react';

const Navbar = ({onMenuClick}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [loggingOut,setLoggingOut] = useState(false);
  const adminToken = useSelector((state)=>state.admin?.adminToken);
  const doctorToken = useSelector((state)=>state.doctor?.doctorToken);
  const isDoctor = location.pathname.startsWith("/doctor") || (!adminToken && !localStorage.getItem("adminToken") && Boolean(doctorToken || localStorage.getItem("doctorToken")));

  const handleLogOut = () => {
    if(loggingOut) return;
    const confirmed = window.confirm("Are you sure you want to log out?");
    if(!confirmed) return;
    setLoggingOut(true);
    try {
      if(isDoctor){
        dispatch(doctorLogout());
      } else {
        dispatch(adminLogout());
      }
      toast.success("Logged Out Successfully",{id:"hms-logout"});
      navigate("/login",{replace:true})
    } catch (error) {
      console.log(error)
      toast.error("Unable to log out. Please try again.", {
        id: "hms-logout-error",
      });
    } finally {
      setLoggingOut(false);
    }
  }

  const goToDashboard = () => {
    navigate(isDoctor?"/doctor-dashboard":"/admin-dashboard")
  }

  return (
    <header className='sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl'>
     <div className='flex h-[68px] w-full items-center justify-between gap-2 px-3 sm:h-[72px] sm:gap-4 sm:px-5 lg:px-7'>
      <div className='flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3'>
       <button type='button' onClick={onMenuClick} aria-label='Open navigation menu' aria-controls='app-sidebar' className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 lg:hidden'>
         <Menu size={21}/>
       </button>
       <button type='button' onClick={goToDashboard} className='flex min-w-0 items-center gap-2.5 text-left sm:gap-3 cursor-pointer' aria-label='Go to dashboard'>
        <div className='flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/20 sm:h-11 sm:w-11 sm:rounded-2xl'>
         <Activity size={23} strokeWidth={2.5}/>
        </div>
        <div className='min-w-0'>
         <p className='truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-xl'>Prescripto</p>
          <p className="hidden text-[9px] font-bold tracking-[0.12em] text-slate-500 sm:block sm:text-[10px] sm:tracking-[0.15em]">
                HOSPITAL MANAGEMENT
          </p>
        </div>
       </button>
      </div>
      <div className='flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4'>
       <div className='hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 xl:flex'>
        <span className='relative flex w-2 h-2'>
         <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
         <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-emerald-700">
              Workspace active
        </span>
       </div>
       <div className="hidden h-9 w-px bg-slate-200 sm:block" />
       <div className='flex min-w-0 items-center gap-2 sm:gap-2.5'>
        <div className={`flex w-9 h-9 shrink-0 items-center justify-center rounded-xl sm:w-10 sm:h-10 ${isDoctor ? "bg-cyan-50 text-cyan-700":"bg-blue-50 text-blue-700"}`}>
         {isDoctor ? (
          <Stethoscope size={20}/>
         ):(
          <ShieldCheck size={20}/>
         )}
        </div>
        <div className='hidden min-w-0 sm:block'>
         <p className="max-w-[145px] truncate text-sm font-bold text-slate-800">
                {isDoctor ? "Doctor Portal" : "Administrator"}
         </p>
         <p className="max-w-[145px] truncate text-xs text-slate-500">
                {isDoctor ? "Medical team" : "Hospital management"}
        </p>
        </div>
       </div>
       <button type='button' onClick={handleLogOut} disabled={loggingOut} className='flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-3.5 cursor-pointer' title='Logout'>
        {loggingOut ? (
          <Loader2 size={17} className='animate-spin'/>
        ):(
          <LogOut size={17}/>
        )}
        <span className='hidden sm:inline'>{loggingOut ? "Logging Out...":"Logout"}</span>
       </button>
      </div>
     </div>
    </header>
  )
}

export default Navbar