import React, { createContext, useContext, useState, useEffect } from 'react';
import { DIA_TMF_ZONES } from '../data/diaTmfReferenceModel';
import { INITIAL_STUDIES } from '../data/initialStudiesData';
import { INITIAL_DOCUMENTS, INITIAL_AUDIT_LOGS } from '../data/initialDocumentsData';

const TMFDataContext = createContext();

export const TMFDataProvider = ({ children }) => {
  const [studies, setStudies] = useState(INITIAL_STUDIES);
  const [selectedStudyId, setSelectedStudyId] = useState("CLIN-001");
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [queries, setQueries] = useState([]);
  const [activeZoneFilter, setActiveZoneFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [customFolders, setCustomFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('vigithink_custom_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vigithink_custom_folders', JSON.stringify(customFolders));
    } catch (e) {
      // ignore
    }
  }, [customFolders]);

  // Helper to fetch data from MongoDB backend
  const fetchAllData = async () => {
    try {
      // 1. Fetch studies
      const studiesRes = await fetch('/api/studies');
      if (studiesRes.ok) {
        const studiesJson = await studiesRes.json();
        if (studiesJson.success && Array.isArray(studiesJson.data)) {
          setStudies(studiesJson.data);
          setIsBackendConnected(true);
        }
      }

      // 2. Fetch documents
      const docsRes = await fetch('/api/documents');
      if (docsRes.ok) {
        const docsJson = await docsRes.json();
        if (docsJson.success && Array.isArray(docsJson.data)) {
          setDocuments(docsJson.data);
        }
      }

      // 3. Fetch audit logs
      const auditRes = await fetch('/api/audit-logs');
      if (auditRes.ok) {
        const auditJson = await auditRes.json();
        if (auditJson.success && Array.isArray(auditJson.data)) {
          setAuditLogs(auditJson.data);
        }
      }

      // 4. Fetch milestones
      const milestonesRes = await fetch(`/api/milestones?study_id=${selectedStudyId}`);
      if (milestonesRes.ok) {
        const milestonesJson = await milestonesRes.json();
        if (milestonesJson.success && Array.isArray(milestonesJson.data)) {
          setMilestones(milestonesJson.data);
        }
      }

      // 5. Fetch custom folders
      const foldersRes = await fetch('/api/folders');
      if (foldersRes.ok) {
        const foldersJson = await foldersRes.json();
        if (foldersJson.success && Array.isArray(foldersJson.data)) {
          setCustomFolders(foldersJson.data);
          if (foldersJson.data.length === 0) {
            localStorage.removeItem('vigithink_custom_folders');
          }
        }
      }

      // 6. Fetch quality queries
      const queriesRes = await fetch('/api/queries');
      if (queriesRes.ok) {
        const queriesJson = await queriesRes.json();
        if (queriesJson.success && Array.isArray(queriesJson.data)) {
          setQueries(queriesJson.data);
        }
      }
    } catch (err) {
      console.warn('[eTMF] Backend API sync in offline/mock mode:', err.message);
    }
  };

  // Clear all test data from database
  const clearAllTestData = async (clearStudies = false, user = null) => {
    try {
      const res = await fetch('/api/system/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearStudies, user })
      });
      const data = await res.json();
      if (data.success) {
        setDocuments([]);
        setAuditLogs([]);
        setMilestones([]);
        setQueries([]);
        setCustomFolders([]);
        localStorage.removeItem('vigithink_custom_folders');
        if (clearStudies) {
          setStudies([]);
        }
        await fetchAllData();
        return true;
      }
    } catch (e) {
      console.error('Error clearing test data:', e);
    }
    return false;
  };

  // Reset / Restore demo test data
  const resetDemoData = async () => {
    try {
      const res = await fetch('/api/system/reset-demo', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
    } catch (e) {
      console.error('Error resetting demo data:', e);
    }
    return false;
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 8000); // Live sync polling
    return () => clearInterval(interval);
  }, [selectedStudyId]);

  // Active study
  const activeStudy = studies.find(s => s.id === selectedStudyId) || studies[0] || {
    id: selectedStudyId || "CLIN-001",
    shortName: "Clinidea Trial Protocol",
    title: "Phase III Pivotal Clinical Study",
    countries: []
  };

  // Helper to log Part 11 Audit Trail event
  const logAuditEvent = async (user, action, targetType, targetId, targetTitle, studyId, oldValue, newValue, reason) => {
    const newLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: user?.id || "sys_user",
      user_name: user?.name || "Clinidea User",
      user_role: user?.roleId || "system",
      action,
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle,
      study_id: studyId || selectedStudyId,
      old_value: oldValue || "N/A",
      new_value: newValue || "N/A",
      ip_address: "127.0.0.1",
      reason: reason || "User initiated operation"
    };

    setAuditLogs(prev => [newLog, ...prev]);

    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
    } catch (e) {
      // Local state already updated
    }
  };

  // Upload new document or create placeholder with file or metadata
  const uploadDocument = async (docData, user, file = null) => {
    let newDoc = null;
    const localBlobUrl = file ? URL.createObjectURL(file) : null;

    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_title', docData.document_title || file.name);
        formData.append('study_id', docData.study_id || selectedStudyId);
        formData.append('tmf_zone_id', docData.tmf_zone_id || '01');
        formData.append('tmf_zone_name', docData.tmf_zone_name || 'Trial Management');
        formData.append('tmf_section_id', docData.tmf_section_id || '01.01');
        formData.append('tmf_section_name', docData.tmf_section_name || 'Trial Oversight');
        formData.append('tmf_artifact_id', docData.tmf_artifact_id || '01.01.01');
        formData.append('tmf_artifact_name', docData.tmf_artifact_name || 'Trial Oversight Plan');
        formData.append('country_code', docData.country_code || 'India');
        formData.append('site_id', docData.site_id || 'Site 001');
        formData.append('folder_path', docData.folder_path || `Study > Zone ${docData.tmf_zone_id || '01'} > ${docData.tmf_artifact_name || 'Document'}`);
        formData.append('is_placeholder', docData.is_placeholder ? 'true' : 'false');
        formData.append('is_certified_copy', docData.is_certified_copy ? 'true' : 'false');
        formData.append('source_type', docData.source_type || 'Electronic Native');
        formData.append('user', JSON.stringify(user));

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const json = await res.json();
          newDoc = {
            ...json.data,
            local_blob_url: localBlobUrl,
            file_path: json.data?.file_path || localBlobUrl,
            file_name: json.data?.file_name || file.name,
            file_mimetype: json.data?.file_mimetype || file.type,
            file_format: docData.file_format || (file.name.split('.').pop() || 'PDF').toUpperCase(),
            folder_path: docData.folder_path || json.data?.folder_path
          };
        }
      }
    } catch (err) {
      console.warn('[eTMF] Upload API fallback to client creation:', err.message);
    }

    if (!newDoc) {
      const newDocId = `DOC-2026-${String(documents.length + 1).padStart(4, '0')}`;
      newDoc = {
        ...docData,
        document_id: newDocId,
        study_id: docData.study_id || selectedStudyId,
        upload_date_time: new Date().toISOString(),
        filing_date: new Date().toISOString().split('T')[0],
        uploaded_by_id: user?.id,
        uploaded_by_name: user?.name,
        status: docData.is_placeholder ? 'Placeholder' : 'Draft',
        version_number: docData.is_placeholder ? '0.0' : '0.1',
        qc_status: docData.is_placeholder ? 'Not Started' : 'In Progress',
        qc_score: docData.is_placeholder ? 'Red' : 'Amber',
        checksum_hash: docData.checksum_hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        checkout_status: 'Checked In',
        locked_by_user_id: null,
        local_blob_url: localBlobUrl,
        file_path: localBlobUrl,
        file_name: file ? file.name : docData.file_name,
        file_mimetype: file ? file.type : 'application/pdf',
        folder_path: docData.folder_path || `Study > Zone ${docData.tmf_zone_id || '01'} > ${docData.tmf_artifact_name || 'Document'}`,
        comments: []
      };
      logAuditEvent(user, "DOCUMENT_UPLOADED", "DOCUMENT", newDocId, newDoc.document_title, newDoc.study_id, "None", `Created as ${newDoc.status}`, "Initial upload via Wizard");
    }

    setDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  };

  // Update Document Metadata
  const updateDocumentMetadata = async (docId, updatedFields, user, reason) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.document_id === docId) {
        return { ...doc, ...updatedFields };
      }
      return doc;
    }));

    try {
      await fetch(`/api/documents/${docId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedFields, user, reason })
      });
    } catch (e) {
      logAuditEvent(user, "METADATA_UPDATED", "DOCUMENT", docId, updatedFields.document_title || docId, selectedStudyId, "N/A", "Updated", reason || "Metadata correction");
    }
  };

  // Perform QC Review (Pass / Fail / Query)
  const performQcReview = async (docId, qcStatus, comments, qualityIssueType, user) => {
    const targetDoc = documents.find(d => d.document_id === docId);
    const finalComments = comments || (
      qcStatus === 'Passed'
        ? 'All SOP-TMF-04 quality checks passed and verified.'
        : qcStatus === 'Query Raised'
        ? 'Formal quality query raised for document remediation.'
        : 'Document failed quality inspection and returned for correction.'
    );
    const finalIssueType = qualityIssueType || (qcStatus === 'Query Raised' ? 'Quality / ALCOA+ Query' : qcStatus === 'Failed' ? 'Rejected for Correction' : null);

    setDocuments(prev => prev.map(doc => {
      if (doc.document_id === docId) {
        let newScore = "Green";
        let newDocStatus = doc.status;
        if (qcStatus === 'Passed') {
          newScore = "Green";
          newDocStatus = "Approved";
        } else if (qcStatus === 'Failed' || qcStatus === 'Query Raised') {
          newScore = "Red";
          newDocStatus = qcStatus === 'Failed' ? "Rejected/Correction" : "Draft";
        }
        return {
          ...doc,
          qc_status: qcStatus,
          qc_comments: finalComments,
          qc_review_date: new Date().toISOString().split('T')[0],
          qc_reviewer_id: user?.id || 'usr_qc',
          qc_reviewer_name: user?.name || 'QC Reviewer',
          qc_score: newScore,
          status: newDocStatus,
          quality_issue_flag: qcStatus === 'Failed' || qcStatus === 'Query Raised',
          quality_issue_type: finalIssueType
        };
      }
      return doc;
    }));

    try {
      await fetch(`/api/documents/${docId}/qc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qcStatus, comments: finalComments, qualityIssueType: finalIssueType, user })
      });
    } catch (e) {
      // Updated in local state
    }

    logAuditEvent(
      user,
      `QC_REVIEW_${qcStatus.toUpperCase().replace(/\s+/g, '_')}`,
      "DOCUMENT",
      docId,
      targetDoc?.document_title || docId,
      targetDoc?.study_id || selectedStudyId,
      targetDoc?.qc_status || "Pending",
      qcStatus,
      finalComments
    );

    // If Query Raised or Failed, also ensure a formal Query record is created in /api/queries
    if (qcStatus === 'Query Raised' || qcStatus === 'Failed') {
      const newQueryId = `QRY-${Date.now().toString().substring(6)}`;
      const newQuery = {
        query_id: newQueryId,
        document_id: docId,
        study_id: targetDoc?.study_id || selectedStudyId,
        issue_type: finalIssueType || 'Quality / ALCOA+ Query',
        comment: finalComments,
        status: 'Open',
        raised_by_id: user?.id || 'usr_qc',
        raised_by_name: user?.name || 'QC Reviewer',
        raised_date: new Date().toISOString().split('T')[0]
      };
      setQueries(prev => [newQuery, ...prev]);
      try {
        await fetch('/api/queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newQuery)
        });
      } catch (e) {
        // Saved in local state
      }
    }
  };

  // Execute 21 CFR Part 11 Electronic Signature
  const applyPart11ESignature = async (docId, signerMeaning, user, passwordVerificationPin) => {
    const signatureDate = new Date().toISOString().split('T')[0];
    
    setDocuments(prev => prev.map(doc => {
      if (doc.document_id === docId) {
        return {
          ...doc,
          status: 'Effective',
          effective_date: signatureDate,
          approval_date: signatureDate,
          approver_id: user?.id,
          approver_name: user?.name,
          signature_type: 'Electronic (Part 11)',
          qc_score: 'Green'
        };
      }
      return doc;
    }));

    try {
      await fetch(`/api/documents/${docId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, meaning: signerMeaning, passwordVerified: true })
      });
    } catch (e) {
      logAuditEvent(
        user, 
        "ESIGNATURE_EXECUTED", 
        "DOCUMENT", 
        docId, 
        docId, 
        selectedStudyId, 
        "Draft", 
        "Effective", 
        `Part 11 E-Signature applied: ${signerMeaning}`
      );
    }
  };

  // Toggle Document Lock (Check Out / Check In)
  const toggleDocumentLock = async (docId, user, purpose = null) => {
    let newStatus = 'Checked In';

    setDocuments(prev => prev.map(doc => {
      if (doc.document_id === docId) {
        const isCurrentlyLocked = doc.checkout_status === 'Checked Out';
        newStatus = isCurrentlyLocked ? 'Checked In' : 'Checked Out';
        return {
          ...doc,
          checkout_status: newStatus,
          locked_by_user_id: isCurrentlyLocked ? null : user?.id,
          locked_by_user_name: isCurrentlyLocked ? null : user?.name,
          checkout_purpose: isCurrentlyLocked ? null : purpose
        };
      }
      return doc;
    }));

    try {
      await fetch(`/api/documents/${docId}/checkout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, purpose })
      });
    } catch (e) {
      logAuditEvent(
        user,
        newStatus === 'Checked Out' ? "DOCUMENT_LOCKED" : "DOCUMENT_UNLOCKED",
        "DOCUMENT",
        docId,
        docId,
        selectedStudyId,
        "N/A",
        newStatus,
        purpose || "Document concurrency lock"
      );
    }
  };

  // Add Comment to Document
  const addDocumentComment = async (docId, user, commentText) => {
    const newComment = {
      id: `comm_${Date.now()}`,
      user: user?.name || "Clinidea User",
      date: new Date().toLocaleString(),
      text: commentText
    };

    setDocuments(prev => prev.map(doc => {
      if (doc.document_id === docId) {
        return { ...doc, comments: [...(doc.comments || []), newComment] };
      }
      return doc;
    }));

    try {
      await fetch(`/api/documents/${docId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, text: commentText })
      });
    } catch (e) {
      logAuditEvent(user, "COMMENT_ADDED", "DOCUMENT", docId, "Discussion", selectedStudyId, "None", commentText, "User added comment");
    }
  };

  // Calculate dynamic TMF Completeness & RAG Score per Zone
  const getZoneCompletenessMetrics = (zoneId, studyId = selectedStudyId) => {
    const studyDocs = documents.filter(d => d.study_id === studyId && d.tmf_zone_id === zoneId);
    const effectiveDocs = studyDocs.filter(d => d.status === 'Effective' || d.status === 'Approved');
    const missingPlaceholders = studyDocs.filter(d => d.status === 'Placeholder' || d.qc_status === 'Failed');
    
    const zoneDef = DIA_TMF_ZONES.find(z => z.id === zoneId);
    let totalArtifactsInZone = 0;
    zoneDef?.sections.forEach(s => {
      totalArtifactsInZone += s.artifacts.length;
    });

    const totalCount = Math.max(studyDocs.length, totalArtifactsInZone);
    const pct = totalCount === 0 ? 100 : Math.round((effectiveDocs.length / totalCount) * 100);
    
    let rag = "Green";
    if (pct < 70 || missingPlaceholders.length > 2) rag = "Red";
    else if (pct < 85 || missingPlaceholders.length > 0) rag = "Amber";

    return { total: totalCount, effective: effectiveDocs.length, missing: missingPlaceholders.length, pct, rag };
  };

  // 1. Create New Study
  const createStudy = async (studyData, user) => {
    const newStudy = {
      ...studyData,
      id: studyData.id || `STUDY-${Date.now().toString().substring(7)}`,
      status: 'Active',
      createdAt: new Date().toISOString(),
      countries: studyData.countries || [],
      milestones: studyData.milestones || []
    };

    setStudies(prev => [newStudy, ...prev]);
    setSelectedStudyId(newStudy.id);

    try {
      await fetch('/api/studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newStudy, user })
      });
    } catch (e) {
      console.warn('[eTMF] Study created locally:', e.message);
    }

    logAuditEvent(user, "STUDY_CREATED", "STUDY", newStudy.id, newStudy.title, newStudy.id, "N/A", "Active", "New clinical trial protocol initiated");
    return newStudy;
  };

  // 2. Add Country to Study
  const addCountryToStudy = async (studyId, countryData, user) => {
    setStudies(prev => prev.map(s => {
      if (s.id === studyId) {
        return {
          ...s,
          countries: [...(s.countries || []), countryData]
        };
      }
      return s;
    }));

    try {
      await fetch(`/api/studies/${studyId}/country`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryData, user })
      });
    } catch (e) {
      console.warn('[eTMF] Country added locally:', e.message);
    }

    logAuditEvent(user, "COUNTRY_ADDED", "STUDY", studyId, `${countryData.name} (${countryData.code})`, studyId, "N/A", "Active", `Participating country added`);
  };

  // 3. Add Site to Study Country
  const addSiteToStudy = async (studyId, countryId, siteData, user) => {
    setStudies(prev => prev.map(s => {
      if (s.id === studyId) {
        return {
          ...s,
          countries: (s.countries || []).map(c => {
            if (c.id === countryId || c.code === countryId) {
              return { ...c, sites: [...(c.sites || []), siteData] };
            }
            return c;
          })
        };
      }
      return s;
    }));

    try {
      await fetch(`/api/studies/${studyId}/site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryId, site: siteData, user })
      });
    } catch (e) {
      console.warn('[eTMF] Site added locally:', e.message);
    }

    logAuditEvent(user, "SITE_ADDED", "SITE", siteData.id || siteData.number, `Site ${siteData.number} - ${siteData.name}`, studyId, "N/A", "Active", `Trial site configured`);
  };

  // 4. Archive Study / Close-Out
  const archiveStudy = async (studyId, reason, user) => {
    setStudies(prev => prev.map(s => s.id === studyId ? { ...s, status: 'Archived' } : s));

    try {
      await fetch(`/api/studies/${studyId}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, user })
      });
    } catch (e) {
      console.warn('[eTMF] Study archived locally:', e.message);
    }

    logAuditEvent(user, "STUDY_ARCHIVED", "STUDY", studyId, studyId, studyId, "Active", "Archived", reason || "Trial completed; digital TMF archived");
  };

  // 5. Copy Document
  const copyDocument = async (docId, copyPayload, user) => {
    const sourceDoc = documents.find(d => d.document_id === docId);
    if (!sourceDoc) return;

    const newDocId = `DOC-2026-${String(documents.length + 1).padStart(4, '0')}`;
    const copiedDoc = {
      ...sourceDoc,
      document_id: newDocId,
      document_title: `${sourceDoc.document_title} (Copy)`,
      study_id: copyPayload.targetStudyId || sourceDoc.study_id,
      country_code: copyPayload.targetCountry || sourceDoc.country_code,
      site_id: copyPayload.targetSite || sourceDoc.site_id,
      folder_path: copyPayload.targetFolder || sourceDoc.folder_path,
      upload_date_time: new Date().toISOString(),
      filing_date: new Date().toISOString().split('T')[0],
      status: 'Effective'
    };

    setDocuments(prev => [copiedDoc, ...prev]);

    try {
      await fetch(`/api/documents/${docId}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...copyPayload, user })
      });
    } catch (e) {
      console.warn('[eTMF] Document copied locally:', e.message);
    }

    logAuditEvent(user, "DOCUMENT_COPIED", "DOCUMENT", newDocId, copiedDoc.document_title, copiedDoc.study_id, sourceDoc.folder_path, copiedDoc.folder_path, "Document copied to target repository path");
    return copiedDoc;
  };

  // 6. Move Document
  const moveDocument = async (docId, movePayload, user) => {
    setDocuments(prev => prev.map(d => {
      if (d.document_id === docId) {
        return {
          ...d,
          folder_path: movePayload.targetFolder,
          tmf_zone_id: movePayload.tmfZoneId || d.tmf_zone_id,
          tmf_zone_name: movePayload.tmfZoneName || d.tmf_zone_name,
          tmf_section_id: movePayload.tmfSectionId || d.tmf_section_id,
          tmf_artifact_id: movePayload.tmfArtifactId || d.tmf_artifact_id
        };
      }
      return d;
    }));

    try {
      await fetch(`/api/documents/${docId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...movePayload, user })
      });
    } catch (e) {
      console.warn('[eTMF] Document moved locally:', e.message);
    }

    logAuditEvent(user, "DOCUMENT_MOVED", "DOCUMENT", docId, docId, selectedStudyId, "Original Location", movePayload.targetFolder, "Artifact relocated in DIA hierarchy");
  };

  // 7. Create New Document Version
  const createNewDocumentVersion = async (docId, versionData, user) => {
    setDocuments(prev => prev.map(d => {
      if (d.document_id === docId) {
        return {
          ...d,
          version_number: versionData.newVersion,
          status: 'Draft',
          qc_status: 'In Progress',
          qc_score: 'Amber',
          upload_date_time: new Date().toISOString(),
          filing_date: new Date().toISOString().split('T')[0]
        };
      }
      return d;
    }));

    try {
      await fetch(`/api/documents/${docId}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...versionData, user })
      });
    } catch (e) {
      console.warn('[eTMF] Version created locally:', e.message);
    }

    logAuditEvent(user, "NEW_VERSION_CREATED", "DOCUMENT", docId, docId, selectedStudyId, "Previous Version", versionData.newVersion, versionData.changeDescription || "Author submitted updated version");
  };

  // 8. Download Actual Uploaded File or Part 11 Certified Dossier
  const downloadDocumentFile = (doc) => {
    const fileUrl = doc.local_blob_url || doc.file_path;
    if (fileUrl) {
      const anchor = document.createElement('a');
      anchor.href = fileUrl;
      anchor.download = doc.file_name || `${doc.document_title || doc.document_id}.pdf`;
      anchor.target = '_blank';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return;
    }

    const downloadUrl = `/api/documents/${doc.document_id}/download`;
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `${doc.document_id}_Part11_Certified.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  // Rename Document Title & File Name (for users with upload/edit permission)
  const renameDocument = async (docId, newTitle, newFileName, user) => {
    const targetDoc = documents.find(d => d.document_id === docId);
    const oldTitle = targetDoc?.document_title || docId;
    const updatedFields = {
      document_title: newTitle,
      file_name: newFileName || targetDoc?.file_name
    };

    setDocuments(prev => prev.map(d => (d.document_id === docId ? { ...d, ...updatedFields } : d)));

    try {
      await fetch(`/api/documents/${docId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedFields,
          user,
          reason: `Document renamed from "${oldTitle}" to "${newTitle}" by ${user?.name || 'User'}`
        })
      });
    } catch (e) {
      // Updated in local state
    }
    logAuditEvent(user, "DOCUMENT_RENAMED", "DOCUMENT", docId, newTitle, targetDoc?.study_id || selectedStudyId, oldTitle, newTitle, "Document renamed by authorized user");
  };

  // Custom Folder Creation, Renaming & Deletion (for users with upload permission)
  const createCustomFolder = async (folderData, user) => {
    const newFolder = {
      id: `fld_${Date.now()}`,
      name: folderData.name.trim(),
      study_id: folderData.study_id || selectedStudyId,
      tmf_zone_id: folderData.tmf_zone_id || null,
      tmf_section_id: folderData.tmf_section_id || null,
      site_id: folderData.site_id || null,
      created_by: user?.name || 'Clinidea User',
      created_by_role: user?.roleId || user?.role || 'User',
      created_at: new Date().toISOString().split('T')[0]
    };
    setCustomFolders(prev => [...prev, newFolder]);
    try {
      await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newFolder, user })
      });
    } catch (e) {
      // Saved in local state & localStorage
    }
    logAuditEvent(user, "FOLDER_CREATED", "FOLDER", newFolder.id, newFolder.name, newFolder.study_id, "None", newFolder.name, `Custom folder created by ${user?.name}`);
    return newFolder;
  };

  const renameCustomFolder = async (folderId, newName, user) => {
    const target = customFolders.find(f => f.id === folderId);
    setCustomFolders(prev => prev.map(f => (f.id === folderId ? { ...f, name: newName.trim() } : f)));
    try {
      await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), user })
      });
    } catch (e) {
      // Updated in local state
    }
    logAuditEvent(user, "FOLDER_RENAMED", "FOLDER", folderId, newName, target?.study_id || selectedStudyId, target?.name || folderId, newName, `Folder renamed by ${user?.name}`);
  };

  const deleteCustomFolder = async (folderId, user) => {
    const target = customFolders.find(f => f.id === folderId);
    setCustomFolders(prev => prev.filter(f => f.id !== folderId));
    try {
      await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      });
    } catch (e) {
      // Removed from local state
    }
    logAuditEvent(user, "FOLDER_DELETED", "FOLDER", folderId, target?.name || folderId, target?.study_id || selectedStudyId, target?.name || "Active", "DELETED", `Custom folder deleted by ${user?.name}`);
  };

  // 9. Export Audit Trail CSV
  const exportAuditTrailCsv = () => {
    const logsToExport = auditLogs.filter(l => l.study_id === selectedStudyId || selectedStudyId === 'ALL');
    const headers = ['Timestamp', 'User Name', 'User Role', 'Action', 'Target Title', 'Target ID', 'Study ID', 'Old Value', 'New Value', 'IP Address', 'Reason'];
    const rows = logsToExport.map(l => [
      `"${l.timestamp}"`,
      `"${l.user_name}"`,
      `"${l.user_role}"`,
      `"${l.action}"`,
      `"${(l.target_title || '').replace(/"/g, '""')}"`,
      `"${l.target_id}"`,
      `"${l.study_id}"`,
      `"${(l.old_value || '').replace(/"/g, '""')}"`,
      `"${(l.new_value || '').replace(/"/g, '""')}"`,
      `"${l.ip_address}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VigiThink_eTMF_AuditTrail_${selectedStudyId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 10. Export Document Manifest CSV
  const exportDocumentManifestCsv = (studyId = selectedStudyId) => {
    const docsToExport = documents.filter(d => studyId === 'ALL' || d.study_id === studyId);
    const headers = ['Document ID', 'Title', 'Study ID', 'Country', 'Site', 'Zone', 'Section', 'Artifact', 'Version', 'Status', 'QC Status', 'SHA-256 Hash', 'Filing Date', 'Uploader'];
    const rows = docsToExport.map(d => [
      `"${d.document_id}"`,
      `"${(d.document_title || '').replace(/"/g, '""')}"`,
      `"${d.study_id}"`,
      `"${d.country_code}"`,
      `"${d.site_id}"`,
      `"${d.tmf_zone_id}"`,
      `"${d.tmf_section_id}"`,
      `"${d.tmf_artifact_id}"`,
      `"${d.version_number}"`,
      `"${d.status}"`,
      `"${d.qc_status}"`,
      `"${d.checksum_hash}"`,
      `"${d.filing_date}"`,
      `"${d.uploaded_by_name || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VigiThink_eTMF_Manifest_${studyId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 11. Raise Quality Query
  const raiseQuery = async (queryData, user) => {
    const newQueryId = `QRY-${Date.now().toString().substring(6)}`;
    const newQuery = {
      ...queryData,
      query_id: newQueryId,
      study_id: queryData.study_id || selectedStudyId,
      issue_type: queryData.issue_type || 'Quality / ALCOA+ Query',
      comment: queryData.comment || 'Quality query raised for remediation.',
      status: 'Open',
      raised_by_id: user?.id || 'usr_qc',
      raised_by_name: user?.name || 'QC Reviewer',
      raised_date: new Date().toISOString().split('T')[0]
    };

    setQueries(prev => [newQuery, ...prev]);

    setDocuments(prev => prev.map(d => {
      if (d.document_id === queryData.document_id) {
        return {
          ...d,
          qc_status: 'Query Raised',
          qc_score: 'Red',
          qc_comments: newQuery.comment,
          quality_issue_flag: true,
          quality_issue_type: newQuery.issue_type
        };
      }
      return d;
    }));

    try {
      await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuery)
      });
    } catch (e) {
      console.warn('[eTMF] Query raised locally:', e.message);
    }

    logAuditEvent(user, "QUERY_RAISED", "DOCUMENT", queryData.document_id, newQuery.issue_type, newQuery.study_id, "QC Review", "Query Raised", newQuery.comment);
    return newQuery;
  };

  // 12. Resolve Quality Query
  const resolveQuery = async (queryId, responseText, user, newStatus = 'Resolved') => {
    const targetQuery = queries.find(q => q.query_id === queryId);
    const finalResponse = responseText || 'Remediated and verified.';

    setQueries(prev => prev.map(q =>
      q.query_id === queryId
        ? { ...q, status: newStatus, response: finalResponse, resolved_by_name: user?.name || 'Reviewer', resolved_date: new Date().toISOString().split('T')[0] }
        : q
    ));

    if (targetQuery?.document_id) {
      setDocuments(prev => prev.map(d => {
        if (d.document_id === targetQuery.document_id) {
          return {
            ...d,
            qc_status: 'Passed',
            qc_score: 'Green',
            status: 'Approved',
            quality_issue_flag: false,
            qc_comments: `Query ${queryId} resolved: ${finalResponse}`
          };
        }
        return d;
      }));
    }

    try {
      await fetch(`/api/queries/${queryId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: finalResponse, status: newStatus, user })
      });
    } catch (e) {
      console.warn('[eTMF] Query resolved locally:', e.message);
    }

    logAuditEvent(user, "QUERY_RESOLVED", "QUERY", queryId, targetQuery?.issue_type || queryId, targetQuery?.study_id || selectedStudyId, "Open", newStatus, finalResponse);
  };

  // Delete document (System Administrator only)
  const deleteDocument = async (docId, user, reason = "Deleted by System Administrator") => {
    setDocuments(prev => prev.filter(d => d.document_id !== docId));
    try {
      await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, reason })
      });
    } catch (e) {
      logAuditEvent(user, "DOCUMENT_DELETED", "DOCUMENT", docId, docId, selectedStudyId, "Active", "DELETED", reason);
    }
  };

  // Delete study (System Administrator only)
  const deleteStudy = async (studyId, user, reason = "Study deleted by System Administrator") => {
    const remainingStudies = studies.filter(s => s.id !== studyId);
    setStudies(remainingStudies);
    setDocuments(prev => prev.filter(d => d.study_id !== studyId));
    if (selectedStudyId === studyId && remainingStudies.length > 0) {
      setSelectedStudyId(remainingStudies[0].id);
    }

    try {
      await fetch(`/api/studies/${encodeURIComponent(studyId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, reason })
      });
    } catch (e) {
      console.warn('[eTMF] Study deleted locally:', e.message);
    }
    logAuditEvent(user, "STUDY_DELETED", "STUDY", studyId, studyId, studyId, "Active", "DELETED", reason);
  };

  return (
    <TMFDataContext.Provider value={{
      zonesTaxonomy: DIA_TMF_ZONES,
      studies,
      selectedStudyId,
      setSelectedStudyId,
      activeStudy,
      documents,
      auditLogs,
      milestones,
      queries,
      activeZoneFilter,
      setActiveZoneFilter,
      searchQuery,
      setSearchQuery,
      isBackendConnected,
      uploadDocument,
      updateDocumentMetadata,
      performQcReview,
      applyPart11ESignature,
      toggleDocumentLock,
      addDocumentComment,
      getZoneCompletenessMetrics,
      logAuditEvent,
      refreshData: fetchAllData,
      createStudy,
      deleteStudy,
      addCountryToStudy,
      addSiteToStudy,
      archiveStudy,
      copyDocument,
      moveDocument,
      createNewDocumentVersion,
      downloadDocumentFile,
      exportAuditTrailCsv,
      exportDocumentManifestCsv,
      raiseQuery,
      resolveQuery,
      deleteDocument,
      renameDocument,
      customFolders,
      createCustomFolder,
      renameCustomFolder,
      deleteCustomFolder,
      clearAllTestData,
      resetDemoData,
      fetchData: fetchAllData
    }}>
      {children}
    </TMFDataContext.Provider>
  );
};

export const useTMFData = () => useContext(TMFDataContext);

