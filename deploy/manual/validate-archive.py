#!/usr/bin/env python3
"""Extract only ordinary, unique relative files into an isolated release directory."""
import posixpath
import sys
import tarfile

seen = set()
with tarfile.open(sys.argv[1], 'r:gz') as archive:
    for member in archive:
        name = posixpath.normpath(member.name)
        if name == '.' and member.isdir():
            continue
        if (member.name.startswith('/') or name in ('', '..') or name.startswith('../')
                or name in seen or not (member.isfile() or member.isdir())):
            raise SystemExit('Unsafe archive member')
        seen.add(name)
    archive.extractall(sys.argv[2], filter='data')
