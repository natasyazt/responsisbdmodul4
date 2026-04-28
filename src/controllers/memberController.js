import { MemberModel } from '../models/memberModel.js';

export const MemberController = {
  // Mendapatkan semua daftar anggota
  async getAllMembers(req, res) {
    try {
      const members = await MemberModel.getAll();
      res.json(members);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Mendaftarkan anggota baru
  async registerMember(req, res) {
    try {
      const newMember = await MemberModel.create(req.body);
      res.status(201).json({
        message: "Anggota berhasil didaftarkan!",
        data: newMember
      });
    } catch (err) {
      // Menangkap error jika email sudah ada di database (Unique Constraint)
      if (err.message.includes('unique constraint') || err.code === '23505') {
        return res.status(400).json({ 
          error: "Pendaftaran gagal: Email tersebut sudah terdaftar di sistem. Silakan gunakan email lain." 
        });
      }
      res.status(400).json({ error: err.message });
    }
  }
};
