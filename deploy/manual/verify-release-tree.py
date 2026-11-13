#!/usr/bin/env python3
"""Compare a retry target with every regular file in the source archive."""
import hashlib
import pathlib
import sys
import tarfile

target = pathlib.Path(sys.argv[2])
expected = set()
with tarfile.open(sys.argv[1], 'r:gz') as archive:
    for member in archive:
        name = pathlib.PurePosixPath(member.name)
        if str(name) == '.' and member.isdir():
            continue
        path = target.joinpath(*name.parts)
        expected.add(path.relative_to(target).as_posix())
        for parent in path.relative_to(target).parents:
            if str(parent) != '.':
                expected.add(parent.as_posix())
        if member.isdir():
            if not path.is_dir() or path.is_symlink():
                raise SystemExit('Release directory differs')
        elif member.isfile():
            source = archive.extractfile(member)
            if source is None or not path.is_file() or path.is_symlink():
                raise SystemExit('Release file missing')
            if hashlib.sha256(source.read()).digest() != hashlib.sha256(path.read_bytes()).digest():
                raise SystemExit('Release file differs')
        else:
            raise SystemExit('Unsafe archive member')
for path in target.rglob('*'):
    relative = path.relative_to(target).as_posix()
    if relative != '.source-archive.sha256' and relative not in expected:
        raise SystemExit('Unexpected release file')
