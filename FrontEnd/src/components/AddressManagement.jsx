import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './addressManagement.css';
import { FaHome, FaBriefcase, FaMapMarkerAlt, FaCheckCircle, FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

const AddressManagement = () => {
    const [addresses, setAddresses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const API_URL = import.meta.env.VITE_API_URL; 

    const [formData, setFormData] = useState({
        name: '', 
        mobile: '', 
        pincode: '', 
        address: '', 
        landmark: '', 
        address_type: 'Home', 
        is_default: false
    });
    
    const [editId, setEditId] = useState(null);


    const fetchAddresses = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            
            const response = await axios.get(`${API_URL}/users/addresses/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddresses(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if ((name === 'mobile' || name === 'pincode') && !/^\d*$/.test(value)) return;
        
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };


    const validateForm = () => {
        if (formData.name.trim().length < 3) {
            toast.warning("Name must be at least 3 characters.");
            return false;
        }
        if (formData.mobile.length !== 10) {
            toast.warning("Mobile number must be exactly 10 digits.");
            return false;
        }
        if (formData.pincode.length !== 6) {
            toast.warning("Pincode must be exactly 6 digits.");
            return false;
        }
        if (formData.address.trim().length < 10) {
            toast.warning("Please provide a full address (min 10 chars).");
            return false;
        }
        return true;
    };

    const openAddModal = () => {
        if (addresses.length >= 3) {
            toast.error("You can only add up to 3 delivery addresses.");
            return;
        }

        setFormData({
            name: '', mobile: '', pincode: '', 
            address: '', landmark: '', 
            address_type: 'Home', is_default: false
        });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (addr) => {
        setFormData(addr);
        setEditId(addr.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return; 

        const token = localStorage.getItem('access_token');
        try {
            if (isEditing) {
                await axios.put(`${API_URL}/users/addresses/${editId}/`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Address updated successfully!");
            } else {
                await axios.post(`${API_URL}/users/addresses/`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Address added successfully!");
            }
            setShowModal(false);
            fetchAddresses();
        } catch (error) {
            console.error(error);
            toast.error("Operation failed. Please try again.");
        }
    };


    const handleDelete = async (id) => {
        const token = localStorage.getItem('access_token');
        try {
            await axios.delete(`${API_URL}/users/addresses/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Address deleted");
            fetchAddresses();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const getIcon = (type) => {
        if (type === 'Home') return <FaHome />;
        if (type === 'Work') return <FaBriefcase />;
        return <FaMapMarkerAlt />;
    };

    return (
        <div className="am-container">
            <div className="am-header">
                <h2>My Addresses</h2>
                <button className="am-add-btn" onClick={openAddModal}>
                    <FaPlus /> ADD NEW ADDRESS
                </button>
            </div>

            {loading ? <p className="am-loading">Loading addresses...</p> : (
                <div className="am-grid">
                    {addresses.map((addr) => (
                        <div key={addr.id} className={`am-card ${addr.is_default ? 'am-card-default' : ''}`}>
                            <div className="am-card-top">
                                <span className="am-badge">
                                    {getIcon(addr.address_type)} {addr.address_type}
                                </span>
                                {addr.is_default && <span className="am-badge-default"><FaCheckCircle /> Default</span>}
                            </div>
                            
                            <h3 className="am-card-name">{addr.name}</h3>
                            <p className="am-card-phone">+91 {addr.mobile}</p>
                            
                            <div className="am-card-body">
                                <p>{addr.address}</p>
                                {addr.landmark && <p className="am-landmark">Landmark: {addr.landmark}</p>}
                                <p className="am-pincode">Pincode: <strong>{addr.pincode}</strong></p>
                            </div>

                            <div className="am-card-actions">
                                <button className="am-btn-edit" onClick={() => openEditModal(addr)}>
                                    <FaEdit /> Edit
                                </button>
                                <button className="am-btn-delete" onClick={() => handleDelete(addr.id)}>
                                    <FaTrash /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {addresses.length === 0 && (
                        <div className="am-empty-state">
                            <p>No addresses found. Add one to get started!</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="am-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="am-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="am-modal-header">
                            <h3>{isEditing ? 'Edit Address' : 'Add New Address'}</h3>
                            <button className="am-close-modal" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        
                        <form className="am-form" onSubmit={handleSubmit}>
                            <div className="am-form-group">
                                <label>Full Name</label>
                                <input className="am-input" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter name" />
                            </div>

                            <div className="am-form-row">
                                <div className="am-form-group">
                                    <label>Mobile Number</label>
                                    <input className="am-input" type="text" name="mobile" value={formData.mobile} onChange={handleChange} required placeholder="10-digit mobile" maxLength="10" />
                                </div>
                                <div className="am-form-group">
                                    <label>Pincode</label>
                                    <input className="am-input" type="text" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="6-digit pincode" maxLength="6" />
                                </div>
                            </div>

                            <div className="am-form-group">
                                <label>Address (Area and Street)</label>
                                <textarea className="am-textarea" name="address" value={formData.address} onChange={handleChange} required rows="3" placeholder="Enter full address"></textarea>
                            </div>

                            <div className="am-form-group">
                                <label>Landmark (Optional)</label>
                                <input className="am-input" type="text" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="E.g. Near Metro Station" />
                            </div>

                            <div className="am-form-group">
                                <label>Address Type</label>
                                <div className="am-radio-group">
                                    <label className={`am-radio-label ${formData.address_type === 'Home' ? 'selected' : ''}`}>
                                        <input type="radio" name="address_type" value="Home" checked={formData.address_type === 'Home'} onChange={handleChange} />
                                        Home
                                    </label>
                                    <label className={`am-radio-label ${formData.address_type === 'Work' ? 'selected' : ''}`}>
                                        <input type="radio" name="address_type" value="Work" checked={formData.address_type === 'Work'} onChange={handleChange} />
                                        Work
                                    </label>
                                    <label className={`am-radio-label ${formData.address_type === 'Other' ? 'selected' : ''}`}>
                                        <input type="radio" name="address_type" value="Other" checked={formData.address_type === 'Other'} onChange={handleChange} />
                                        Other
                                    </label>
                                </div>
                            </div>

                            <div className="am-checkbox-group">
                                <input type="checkbox" id="defaultCheck" name="is_default" checked={formData.is_default} onChange={handleChange} />
                                <label htmlFor="defaultCheck">Make this my default address</label>
                            </div>

                            <div className="am-modal-footer">
                                <button type="button" className="am-btn-cancel" onClick={() => setShowModal(false)}>CANCEL</button>
                                <button type="submit" className="am-btn-save">SAVE ADDRESS</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressManagement;